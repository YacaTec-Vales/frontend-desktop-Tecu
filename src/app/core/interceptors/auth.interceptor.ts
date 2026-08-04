import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor funcional de autenticación.
 * Adjunta el token JWT y cabeceras personalizadas a cada petición saliente.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

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
