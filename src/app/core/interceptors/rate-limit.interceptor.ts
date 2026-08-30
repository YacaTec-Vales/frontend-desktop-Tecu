import { HttpContext, HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';

/**
 * HttpContext token: cuando una peticion lleva este token en true,
 * el `rateLimitInterceptor` la deja pasar aunque la URL tenga
 * timestamp reciente. Lo usan los refreshes explicitos (dashboard,
 * auditoria, paginacion) para evitar el 429 sintetico.
 *
 * Ejemplo:
 *   this.http.get(url, { context: new HttpContext().set(BYPASS_RATE_LIMIT, true) });
 */
export const BYPASS_RATE_LIMIT = new HttpContextToken<boolean>(() => false);

const requestTimestamps = new Map<string, number>();

/** Ventana de cooldown (ms) entre llamadas al mismo endpoint. */
const RATE_LIMIT_MS = 4000;

/**
 * Rate-limit funcional aplicado unicamente a metodos mutantes
 * (POST / PATCH / DELETE). Anteriormente se aplicaba tambien a
 * GET, lo que bloqueaba el dashboard del administrador (cuyo
 * `refresh()` dispara dos GETs a la misma URL en menos de un
 * segundo) con un 429 sintetico que el `errorInterceptor`
 * trataba como "Demasiadas peticiones", dejando la app en estado
 * roto.
 */
export const rateLimitInterceptor: HttpInterceptorFn = (req, next) => {
  const allowedMethods = ['POST', 'PATCH', 'DELETE', 'PUT'];
  if (!allowedMethods.includes(req.method)) {
    return next(req);
  }

  if (req.context.get(BYPASS_RATE_LIMIT)) {
    return next(req);
  }

  const url = req.urlWithParams;
  const now = Date.now();
  const lastRequestTime = requestTimestamps.get(url);

  if (lastRequestTime && (now - lastRequestTime) < RATE_LIMIT_MS) {
    const errorResponse = new HttpErrorResponse({
      error: { message: 'Demasiadas peticiones. Por favor, espera un momento.' },
      status: 429,
      statusText: 'Too Many Requests',
      url: req.url,
    });
    return throwError(() => errorResponse);
  }

  requestTimestamps.set(url, now);
  return next(req);
};
