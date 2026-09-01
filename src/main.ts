import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
// IMPORT EAGER: ver frontend-mobile-poch/src/main.ts para el comentario
// completo. Mismo patron anti-tree-shake (for-in loop + globalThis).
import { environment as EAGER_ENV } from './environments/environment';
const __envGlobal = globalThis as unknown as Record<string, unknown>;
for (const __envKey in EAGER_ENV) {
  if (Object.prototype.hasOwnProperty.call(EAGER_ENV, __envKey)) {
    __envGlobal['__MISVALES_' + __envKey.toUpperCase()] = (EAGER_ENV as Record<string, unknown>)[__envKey];
  }
}
__envGlobal['__MISVALES_ENV_KEYS__'] = Object.keys(EAGER_ENV).join(',');
if (typeof console !== 'undefined') {
  console.warn(
    '[misvales] api=' + __envGlobal['__MISVALES_APIURL'] + ' recaptcha=' + (__envGlobal['__MISVALES_RECAPTCHASITEKEY'] ? 'on' : 'off'),
  );
}

/**
 * Pre-carga el script de Google reCAPTCHA v3 antes del bootstrap de
 * Angular. Asi, cuando el primer HTTP request salga del interceptor
 * (login, mfa/setup, etc.), `window.grecaptcha` ya esta disponible y
 * `grecaptcha.execute()` no devuelve `undefined` por carga tardia.
 *
 * Sin esta precarga, el primer POST dispara `getToken()` mientras
 * grecaptcha aun no esta listo, el interceptor entra en fail-open y
 * el backend responde 400 RECAPTCHA.MISSING.
 */
function preloadRecaptcha(siteKey: string): void {
  if (!siteKey || typeof document === 'undefined') return;
  if (window.grecaptcha) return;
  const script = document.createElement('script');
  script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    console.warn('[reCAPTCHA] precarga falló (posible ad blocker)');
  };
  document.head.appendChild(script);
}

preloadRecaptcha(__envGlobal['__MISVALES_RECAPTCHASITEKEY__'] as string);

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
