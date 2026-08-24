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
      let userFriendlyMessage = 'Ocurrió un error inesperado. Por favor, intente de nuevo.';

      if (error.status === 400 || error.status === 422) {
        userFriendlyMessage = 'Algún dato se mandó mal. Por favor, verifique la información.';
      } else if (error.status === 401) {
        if (req.url.includes('/auth/login')) {
          userFriendlyMessage = 'Credenciales incorrectas. Verifique su usuario y contraseña.';
        } else {
          userFriendlyMessage = 'Su sesión ha expirado o no es válida. Por favor, inicie sesión nuevamente.';
          authService.forceLogout();
        }
      } else if (error.status === 403) {
        userFriendlyMessage = 'No tiene permisos para realizar esta acción.';
      } else if (error.status === 404) {
        userFriendlyMessage = 'El recurso solicitado no fue encontrado.';
      } else if (error.status >= 500) {
        userFriendlyMessage = 'Error, estamos revisando el error.';
      }

      // Mutamos el objeto de error para que los componentes reciban el mensaje amigable
      // Pero conservamos el codigo original y los datos
      const originalError = error.error || {};
      const modifiedError = new HttpErrorResponse({
        error: { 
          message: userFriendlyMessage,
          code: originalError.code || originalError.error?.code,
          data: originalError.data || originalError.error?.data,
          original: originalError
        },
        headers: error.headers,
        status: error.status,
        statusText: error.statusText,
        url: error.url || undefined
      });

      return throwError(() => modifiedError);
    })
  );
};
