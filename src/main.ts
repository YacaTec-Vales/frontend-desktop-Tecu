import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

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

preloadRecaptcha(environment.recaptchaSiteKey);

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
