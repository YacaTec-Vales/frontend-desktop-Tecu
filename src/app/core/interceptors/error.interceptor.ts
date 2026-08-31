import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';

/**
 * Interceptor funcional de errores.
 * Captura errores HTTP y los traduce a mensajes amigables, conservando
 * el codigo original (`error.error.code`) y los datos.
 *
 * Codigos manejados:
 *  - 400/422 -> validacion
 *  - 403     -> AUTH.NOT_VPN_ORIGIN / AUTH.WRONG_CLIENT_APP / generico
 *  - 401     -> sesion expirada (limpia storage y va a /login)
 *  - 404/429 -> mensajes especificos
 *  - 5xx     -> error de servidor
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const originalError = error.error || {};
      const originalCode =
        originalError.code ?? originalError.error?.code ?? null;

      let userFriendlyMessage = 'Ocurrió un error inesperado. Por favor, intente de nuevo.';

      if (error.status === 400 || error.status === 422) {
        userFriendlyMessage = 'Algún dato se mandó mal. Por favor, verifique la información.';
      } else if (error.status === 403) {
        if (originalCode === 'AUTH.NOT_VPN_ORIGIN') {
          userFriendlyMessage =
            'Esta acción solo puede hacerse desde el túnel VPN. Abre vpn.taquizaschavez.com.mx y vuelve a intentar.';
        } else if (originalCode === 'AUTH.WRONG_CLIENT_APP') {
          userFriendlyMessage =
            'Esta acción solo puede hacerse desde la aplicación Tecu.';
        } else if (originalCode === 'AUTH.ORIGIN_NOT_ALLOWED') {
          // FASE A: el backend rechazo el login porque el origen del
          // request (header X-Origin que pone nginx) no esta en
          // `user.allowed_origin`. Para ADMINISTRADOR el unico origen
          // permitido es 'vpn'. El mensaje del backend trae el detalle.
          const details = originalError.details || originalError.error?.details;
          const allowed = details?.allowedOrigins?.join(' o ') ?? 'red privada';
          userFriendlyMessage = `Esta cuenta solo puede iniciar sesion desde ${allowed}. Si necesitas entrar como administrador, abre vpn.taquizaschavez.com.mx.`;
        } else {
          userFriendlyMessage = 'No tiene permisos para realizar esta acción.';
        }
      } else if (error.status === 401) {
        if (req.url.includes('/auth/login')) {
          userFriendlyMessage = 'Credenciales incorrectas. Verifique su usuario y contraseña.';
        } else {
          userFriendlyMessage = 'Su sesión ha expirado o no es válida. Por favor, inicie sesión nuevamente.';
          // Para evitar NG0200 (Circular Dependency con AuthService), limpiamos el storage y navegamos
          // directamente en lugar de usar authService.forceLogout().
          sessionStorage.removeItem('ACCESS_TOKEN');
          sessionStorage.removeItem('REFRESH_TOKEN');
          router.navigate(['/login']);
        }
      } else if (error.status === 404) {
        userFriendlyMessage = 'El recurso solicitado no fue encontrado.';
      } else if (error.status === 429) {
        userFriendlyMessage = 'Demasiadas peticiones. Por favor, espera un momento antes de volver a intentar.';
      } else if (error.status >= 500) {
        userFriendlyMessage = 'Error, estamos revisando el error.';
      }

      // Mutamos el objeto de error para que los componentes reciban el mensaje amigable
      // Pero conservamos el codigo original y los datos
      const modifiedError = new HttpErrorResponse({
        error: {
          message: userFriendlyMessage,
          code: originalCode,
          data: originalError.data || originalError.error?.data,
          original: originalError,
        },
        headers: error.headers,
        status: error.status,
        statusText: error.statusText,
        url: error.url || undefined,
      });

      return throwError(() => modifiedError);
    })
  );
};
