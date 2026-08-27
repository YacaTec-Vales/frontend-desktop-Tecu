import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

/**
 * Interceptor funcional de autenticación.
 * Adjunta el token JWT y cabeceras personalizadas a cada petición saliente.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Leemos el token directamente de sessionStorage para evitar dependencia circular (NG0200)
  // con el AuthService cuando este hace peticiones HTTP en su constructor.
  const token = sessionStorage.getItem('ACCESS_TOKEN');

  // Clonamos la petición para añadir las cabeceras necesarias
  let clonedRequest = req.clone({
    setHeaders: {
      'x-client-app': 'Tecu'
    }
  });

  if (token) {
    clonedRequest = clonedRequest.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Pasamos la petición modificada al siguiente manejador
  return next(clonedRequest);
};
