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
 * Los tokens son de un solo uso y expiran en ~2 minutos; no
 * almacenar ni reutilizar. Cada petición debe pedir un token
 * fresco (el interceptor HTTP lo hace automáticamente).
 */
@Service()
export class RecaptchaService {
  private readonly siteKey = environment.recaptchaSiteKey;
  private scriptLoading?: Promise<void>;

  /** Indica si el captcha está activo en este entorno. */
  get isEnabled(): boolean {
    return this.siteKey.length > 0;
  }

  /**
   * Ejecuta el challenge invisible y devuelve el token.
   *
   * @param action - Identificador semántico del flujo (`login`,
   *   `submit`, ...). Solo `[a-zA-Z0-9/]`.
   * @returns Token reCAPTCHA v3, o `null` si el captcha está
   *   desactivado.
   * @throws Error si el script de Google no pudo cargarse.
   */
  async getToken(action = DEFAULT_RECAPTCHA_ACTION): Promise<string | null> {
    if (!this.isEnabled) return null;

    await this.ensureScript();
    const grecaptcha = window.grecaptcha;
    if (!grecaptcha) {
      throw new Error('grecaptcha no está disponible tras cargar el script');
    }

    return new Promise<string>((resolve, reject) => {
      grecaptcha.ready(() => {
        grecaptcha.execute(this.siteKey, { action }).then(resolve, reject);
      });
    });
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
