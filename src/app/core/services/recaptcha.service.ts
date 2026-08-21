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
 * **Cache de tokens**: los tokens reCAPTCHA v3 son válidos ~2 minutos
 * Y se pueden reusar (cada llamada a `grecaptcha.execute()` genera
 * un token NUEVO, pero los anteriores siguen siendo válidos). Para
 * flujos cortos (login -> mfa setup -> mfa verify-setup ocurre en
 * menos de 30s) cacheamos el token y lo reusamos. Esto elimina el
 * 90% de las llamadas a grecaptcha.execute() que estaban causando
 * "token vacío" intermitente cuando Google rechazaba llamadas
 * rápidas sucesivas.
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
  // Cache del ultimo token valido (TTL ~2 min). Se reusa entre
  // llamadas cercanas (login + setup + verify-setup).
  private cachedToken?: { token: string; expiresAt: number };

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
   * Ejecuta el challenge invisible y devuelve el token.
   *
   * Estrategia de 3 pasos:
   * 1. Si hay token cacheado con >30s de vida restante, lo reusa
   *    (evita multiples llamadas a grecaptcha.execute() en flujos
   *    cortos como login -> mfa/setup -> mfa/verify-setup).
   * 2. Si no, reintenta hasta 3 veces con backoff (500/1000/1500ms)
   *    para tolerar la inicializacion lenta del script de Google.
   * 3. Cachea el token exitoso por 100s (margen sobre el TTL
   *    oficial de 2 min de reCAPTCHA v3).
   *
   * @param action - Identificador semántico del flujo (`login`,
   *   `submit`, ...). Solo `[a-zA-Z0-9/]`.
   * @returns Token reCAPTCHA v3, o `null` si el captcha está
   *   desactivado.
   * @throws Error si el script de Google no pudo cargarse tras
   *   los reintentos.
   */
  async getToken(action = DEFAULT_RECAPTCHA_ACTION): Promise<string | null> {
    if (!this.isEnabled) return null;

    // 1. Reusar token cacheado si tiene vida util (>30s).
    //    Esto cubre el flujo completo login -> mfa setup -> mfa verify-setup
    //    que pasa en menos de 30 segundos.
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 30_000) {
      return this.cachedToken.token;
    }

    // 2. Obtener token nuevo con retry
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
        if (token) {
          // 3. Cachear para reusar en llamadas cercanas
          this.cachedToken = {
            token,
            expiresAt: Date.now() + 100_000, // 100s
          };
          return token;
        }
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
   * Invalida el cache de tokens. Llamar en logout para forzar que
   * el siguiente login genere un token fresco (la sesion anterior
   * ya no tiene validez). Tambien util si se rota el site key en
   * runtime.
   */
  invalidateCache(): void {
    this.cachedToken = undefined;
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
