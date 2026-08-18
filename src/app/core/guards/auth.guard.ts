import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional para proteger las rutas.
 * Verifica si hay una sesión activa antes de permitir la navegación.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si hay token y no ha expirado
  if (authService.getToken() && !authService.isTokenExpired()) {
    return true;
  }

  // Si no hay sesión o ya expiró, limpiamos y redirigimos
  authService.forceLogout();
  return router.createUrlTree(['/login']);
};
