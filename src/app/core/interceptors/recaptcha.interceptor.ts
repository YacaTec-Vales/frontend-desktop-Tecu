import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { RecaptchaService } from '../services/recaptcha.service';

/** Header donde el backend espera el token de reCAPTCHA v3. */
export const RECAPTCHA_TOKEN_HEADER = 'x-recaptcha-token';

/** Métodos HTTP que exigen token según el `RecaptchaGuard` del API. */
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * FASE BUG-3 (2026-08-31): el backend (`RecaptchaGuard` global) exige
 * token en TODOS los metodos mutantes (POST/PUT/PATCH/DELETE) excepto
 * los que tengan `@SkipRecaptcha()` o `@Public()`. Antes este
 * interceptor tenia una whitelist `CRITICAL_PATHS` incompleta que NO
 * cubria paths como `/products/`, `/solicitudes/`, `/categories/`,
 * `/distributors/`, etc., y por tanto el backend rechazaba esos POSTs
 * con 400 RECAPTCHA.MISSING.
 *
 * Solucion: inyectar token en TODO request mutante. El backend decide
 * si el endpoint lo requiere via `@SkipRecaptcha()` / `@Public()`.
 * Si grecaptcha falla, fail-CLOSED en TODOS los endpoints (antes era
 * fail-open para los no-criticos, pero esa diferenciacion ya no
 * aplica porque TODOS son criticos).
 */
function shouldInjectForMethod(method: string): boolean {
  return MUTATING_METHODS.has(method.toUpperCase());
}

/**
 * Adjunta un token fresco de reCAPTCHA v3 a cada peticion mutante
 * (POST/PUT/PATCH/DELETE) via `x-recaptcha-token`.
 *
 * Comportamiento:
 *  - GET/HEAD/OPTIONS pasan sin token.
 *  - Con `recaptchaSiteKey` vacia (dev) pasa sin tocar la peticion.
 *  - El servicio cachea el token por ~100s, asi flujos como
 *    login -> mfa/setup -> mfa/verify-setup reusan el mismo token.
 *  - Si grecaptcha falla: fail-CLOSED (error al usuario) para que sepa
 *    que recargue o desactive su ad blocker. Esto aplica a TODOS los
 *    endpoints mutantes porque el backend SIEMPRE exige token.
 */
export const recaptchaInterceptor: HttpInterceptorFn = (req, next) => {
  const recaptcha = inject(RecaptchaService);

  if (!shouldInjectForMethod(req.method) || !recaptcha.isEnabled) {
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
      console.error(
        `[reCAPTCHA] fail-CLOSED: ${req.method} ${req.url}`,
        err,
      );
      // FAIL-CLOSED: el usuario ve un mensaje claro, no un 400 silencioso.
      return throwError(() => new Error(
        'No se pudo verificar reCAPTCHA. Recarga la pagina o desactiva el bloqueador de anuncios.'
      ));
    }),
  );
};
