import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional para proteger las rutas.
 * Verifica si hay una sesión activa antes de permitir la navegación.
 * Si hay token pero currentUser aún no está hidratado (caso típico al refrescar),
 * espera a que /auth/me termine antes de activar la ruta para evitar que los
 * componentes lean un usuario nulo.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getToken() && !authService.isTokenExpired()) {
    if (authService.currentUser()) {
      return true;
    }
    return authService.getMe().pipe(
      map(() => true),
      catchError(() => {
        authService.forceLogout();
        return of(router.createUrlTree(['/login']));
      })
    );
  }

  authService.forceLogout();
  return router.createUrlTree(['/login']);
};
