import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';

// Mapa para guardar la última vez que se hizo una petición a una URL
const requestTimestamps = new Map<string, number>();

// Límite de tiempo entre peticiones en milisegundos (10 segundos)
const RATE_LIMIT_MS = 10000;

/**
 * Interceptor funcional para limitar la cantidad de peticiones repetitivas.
 * Afecta peticiones GET, POST, PATCH y DELETE.
 * Si se hace una petición a la misma URL antes de que pase el RATE_LIMIT_MS,
 * la petición es bloqueada localmente devolviendo un error 429.
 */
export const rateLimitInterceptor: HttpInterceptorFn = (req, next) => {
  const allowedMethods = ['GET', 'POST', 'PATCH', 'DELETE'];
  
  // Solo limitamos las peticiones especificadas en el arreglo
  if (!allowedMethods.includes(req.method)) {
    return next(req);
  }

  // Usar la URL base sin los parámetros de consulta que cambian frecuentemente, 
  // o toda la URL si es relevante. Aquí usamos la URL completa.
  const url = req.urlWithParams;
  const now = Date.now();
  const lastRequestTime = requestTimestamps.get(url);

  if (lastRequestTime && (now - lastRequestTime) < RATE_LIMIT_MS) {
    // Generar un error HTTP 429 Too Many Requests simulado desde el frontend
    const errorResponse = new HttpErrorResponse({
      error: { message: 'Demasiadas peticiones. Por favor, espera un momento.' },
      status: 429,
      statusText: 'Too Many Requests',
      url: req.url
    });

    return throwError(() => errorResponse);
  }

  // Actualizar el timestamp
  requestTimestamps.set(url, now);

  return next(req);
};
