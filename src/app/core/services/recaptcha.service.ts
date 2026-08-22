import { Service } from '@angular/core';

import { environment } from '../../../environments/environment';

/** Contrato mínimo del global `grecaptcha` que expone reCAPTCHA v3. */
interface GrecaptchaV3 {
  ready(callback: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: GrecaptchaV3;
  }
}

/** URL del cargador JS de reCAPTCHA v3. */
const RECAPTCHA_SCRIPT_URL = 'https://www.google.com/recaptcha/api.js';

/**
 * Acción por defecto enviada a Google. Permite segmentar métricas
 * en el admin de reCAPTCHA; los flujos críticos (login) pueden
 * pasar una acción propia.
 */
export const DEFAULT_RECAPTCHA_ACTION = 'submit';

/**
 * Obtiene tokens de reCAPTCHA v3 para adjuntar a las peticiones
 * mutantes. Auto-gestionada: si `environment.recaptchaSiteKey` está
 * vacía, el servicio queda desactivado y no carga ningún script de
 * Google.
 *
 * **IMPORTANTE**: los tokens reCAPTCHA v3 son SINGLE-USE. Una vez que
 * el backend los valida con Google siteverify, quedan "quemados" y
 * cualquier reuso devuelve `invalid-input-response`. Por eso NO
 * cacheamos el token entre peticiones: cada request mutante genera
 * uno nuevo con `grecaptcha.execute()`.
 *
 * El servicio PRE-CARGA el script de Google en cuanto se instancia
 * (constructor), para que cuando el usuario haga el primer POST ya
 * haya `window.grecaptcha` disponible. Sin esta precarga, el primer
 * request puede dispararse antes de que el script termine de cargar y
 * el backend responde 400 RECAPTCHA.MISSING.
 */
@Service()
export class RecaptchaService {
  private readonly siteKey = environment.recaptchaSiteKey;
  private scriptLoading?: Promise<void>;

  constructor() {
    // Pre-carga inmediata del script al instanciar el servicio.
    // La primera vez se inyecta el <script>; despues queda cacheado
    // por el browser via el http cache normal.
    if (this.isEnabled) {
      void this.ensureScript().catch((err) => {
        console.warn(
          '[reCAPTCHA] precarga inicial falló (se reintentará por peticion):',
          err instanceof Error ? err.message : err,
        );
      });
    }
  }

  /** Indica si el captcha está activo en este entorno. */
  get isEnabled(): boolean {
    return this.siteKey.length > 0;
  }

  /**
   * Ejecuta el challenge invisible y devuelve un token FRESCO.
   *
   * Estrategia de retry (sin cache):
   * 1. Asegurar que el script de Google está cargado (una sola vez).
   * 2. Llamar a `grecaptcha.execute()` que genera un NUEVO token.
   * 3. Si falla, reintentar hasta 3 veces con backoff (500/1000/1500ms)
   *    para tolerar la inicializacion lenta del script o rate limits
   *    momentaneos de Google.
   *
   * El token NO se cachea porque reCAPTCHA v3 tokens son single-use.
   * Cada peticion mutante del frontend genera y envia uno nuevo.
   *
   * @param action - Identificador semántico del flujo (`login`,
   *   `submit`, ...). Solo `[a-zA-Z0-9/]`.
   * @returns Token reCAPTCHA v3 fresco, o `null` si el captcha
   *   está desactivado.
   * @throws Error si el script de Google no pudo cargarse tras
   *   los reintentos.
   */
  async getToken(action = DEFAULT_RECAPTCHA_ACTION): Promise<string | null> {
    if (!this.isEnabled) return null;

    const maxAttempts = 3;
    let lastError: Error | undefined;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await this.ensureScript();
        const grecaptcha = window.grecaptcha;
        if (!grecaptcha) {
          throw new Error('grecaptcha no está disponible tras cargar el script');
        }
        const token = await new Promise<string>((resolve, reject) => {
          grecaptcha.ready(() => {
            grecaptcha.execute(this.siteKey, { action }).then(resolve, reject);
          });
        });
        if (token) return token;
        lastError = new Error('reCAPTCHA devolvió un token vacío');
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(
          `[reCAPTCHA] intento ${attempt + 1}/${maxAttempts} falló:`,
          lastError.message,
        );
      }
      // Espera antes del siguiente intento (500ms, 1000ms, 1500ms).
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
    throw lastError ?? new Error('reCAPTCHA: max reintentos alcanzados');
  }

  /**
   * Inyecta el script de Google una única vez. Resuelve inmediato
   * si ya está presente; fallos resetean la promesa para permitir
   * reintento en la siguiente petición.
   */
  private ensureScript(): Promise<void> {
    if (window.grecaptcha) return Promise.resolve();
    this.scriptLoading ??= new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${RECAPTCHA_SCRIPT_URL}?render=${this.siteKey}`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        this.scriptLoading = undefined;
        reject(new Error('no se pudo cargar el script de reCAPTCHA'));
      };
      document.head.appendChild(script);
    });
    return this.scriptLoading;
  }
}
