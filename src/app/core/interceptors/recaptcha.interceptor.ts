import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { RecaptchaService } from '../services/recaptcha.service';

/** Header donde el backend espera el token de reCAPTCHA v3. */
export const RECAPTCHA_TOKEN_HEADER = 'x-recaptcha-token';

/** Métodos HTTP que exigen token según el `RecaptchaGuard` del API. */
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Endpoints donde la verificacion reCAPTCHA es CRITICA. Si grecaptcha
 * falla en estos endpoints, NO hacemos fail-open silencioso: lanzamos
 * un error claro al usuario en vez de un 400 RECAPTCHA.MISSING
 * misterioso. El usuario sabra que recargar o desactivar su ad blocker.
 *
 * Cualquier endpoint de autenticacion, MFA o gestion de identidad
 * entra aqui. Para el resto (CRUD de negocio, uploads, etc.) se mantiene
 * fail-open porque la verificacion antifraude ya la cubre `VpnOriginGuard`
 * + `PermissionsGuard` en backend.
 */
const CRITICAL_PATHS = [
  '/auth/login',
  '/auth/mfa-verify',
  '/auth/refresh',
  '/auth/logout',
  '/auth/password-reset',
  '/mfa/setup',
  '/mfa/verify-setup',
  '/mfa/disable',
  '/sessions/',
  '/users/',
  '/branches/',
  '/business-config/',
];

function isCriticalEndpoint(url: string): boolean {
  return CRITICAL_PATHS.some((p) => url.includes(p));
}

/**
 * Adjunta un token fresco de reCAPTCHA v3 a cada petición mutante
 * (POST/PUT/PATCH/DELETE) via `x-recaptcha-token`.
 *
 * Comportamiento:
 *  - GET/HEAD/OPTIONS pasan sin token.
 *  - Con `recaptchaSiteKey` vacía (dev) pasa sin tocar la petición.
 *  - El servicio cachea el token por ~100s, asi flujos como
 *    login -> mfa/setup -> mfa/verify-setup reusan el mismo token.
 *  - Endpoints CRITICOS: si grecaptcha falla, fail-CLOSED (error al
 *    usuario) para que sepa que recargue o desactive su ad blocker.
 *  - Otros endpoints: fail-OPEN (request sale sin token) para no
 *    bloquear features de negocio si grecaptcha tiene un falso
 *    positivo.
 */
export const recaptchaInterceptor: HttpInterceptorFn = (req, next) => {
  const recaptcha = inject(RecaptchaService);

  if (
    !MUTATING_METHODS.has(req.method.toUpperCase()) ||
    !recaptcha.isEnabled
  ) {
    return next(req);
  }

  const critical = isCriticalEndpoint(req.url);

  return from(recaptcha.getToken()).pipe(
    switchMap((token) =>
      next(
        token
          ? req.clone({ setHeaders: { [RECAPTCHA_TOKEN_HEADER]: token } })
          : req,
      ),
    ),
    catchError((err) => {
      console.error(
        `[reCAPTCHA] ${critical ? 'CRITICAL fail-CLOSED' : 'fail-open'}: ` +
        `${req.method} ${req.url}`,
        err,
      );
      if (critical) {
        // FAIL-CLOSED: el usuario ve un mensaje claro, no un 400 silencioso.
        return throwError(() => new Error(
          'No se pudo verificar reCAPTCHA. Recarga la pagina o desactiva el bloqueador de anuncios.'
        ));
      }
      // FAIL-OPEN: solo para endpoints no criticos.
      return next(req);
    }),
  );
};
