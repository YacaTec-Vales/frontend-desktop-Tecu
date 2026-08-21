import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap } from 'rxjs';

import { RecaptchaService } from '../services/recaptcha.service';

/** Header donde el backend espera el token de reCAPTCHA v3. */
export const RECAPTCHA_TOKEN_HEADER = 'x-recaptcha-token';

/** Métodos HTTP que exigen token según el `RecaptchaGuard` del API. */
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Adjunta un token fresco de reCAPTCHA v3 a cada petición mutante
 * (POST/PUT/PATCH/DELETE) via `x-recaptcha-token`.
 *
 * Comportamiento:
 *  - GET/HEAD/OPTIONS pasan sin token.
 *  - Con `recaptchaSiteKey` vacía (dev) pasa sin tocar la petición.
 *  - Si Google falla al generar el token tras los reintentos del
 *    servicio, la petición sale igual sin header: el backend es quien
 *    aplica la política final (fail-open en cliente para no bloquear
 *    despliegues escalonados). En consola se loggea un warning claro
 *    para diagnosticar.
 *
 * Los tokens son de un solo uso; este interceptor pide uno nuevo
 * en cada request, incluidos reintentos del usuario.
 */
export const recaptchaInterceptor: HttpInterceptorFn = (req, next) => {
  const recaptcha = inject(RecaptchaService);

  if (
    !MUTATING_METHODS.has(req.method.toUpperCase()) ||
    !recaptcha.isEnabled
  ) {
    return next(req);
  }

  return from(recaptcha.getToken()).pipe(
    switchMap((token) =>
      next(
        token
          ? req.clone({ setHeaders: { [RECAPTCHA_TOKEN_HEADER]: token } })
          : req,
      ),
    ),
    catchError((err) => {
      console.warn(
        `[reCAPTCHA interceptor] no se pudo obtener token para ${req.method} ${req.url}:`,
        err instanceof Error ? err.message : err,
        '→ fail-open: request sale sin x-recaptcha-token.',
      );
      return next(req);
    }),
  );
};
