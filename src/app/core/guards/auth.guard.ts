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

  // Si hay token en sessionStorage o el isAuthenticated es true
  if (authService.getToken()) {
    return true;
  }

  // Si no hay sesión, redirigimos estrictamente al login
  return router.createUrlTree(['/login']);
};
