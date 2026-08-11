import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Interceptor funcional de errores.
 * Captura errores 401 (No Autorizado) de cualquier petición (GET/POST/PUT/DELETE)
 * y fuerza el cierre de sesión redirigiendo al login.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si la sesión expira o el usuario no está autorizado
      if (error.status === 401) {
        // Evitamos ciclos infinitos si la propia petición de login da 401
        if (!req.url.includes('/auth/login')) {
          authService.forceLogout();
        }
      }

      // Reenviar el error para que el componente que hizo la llamada lo maneje si quiere
      return throwError(() => error);
    })
  );
};
