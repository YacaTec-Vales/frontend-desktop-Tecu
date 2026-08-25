import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Lista de roles del sistema (canonica). Coincide 1:1 con los `roleCode`
 * del backend (`backend-api/src/shared/types/auth.types.ts`). Se mantiene
 * sincronizada manualmente: cualquier `UserType` nuevo se agrega aca y
 * se exporta desde el modelo `auth.dto.ts` para uso en guards / servicios.
 */
export const SYSTEM_ROLES = [
  'ADMINISTRADOR',
  'GERENTE_GENERAL',
  'GERENTE_SUCURSAL',
  'COORDINADOR',
  'VERIFICADOR',
  'DISTRIBUIDOR',
  'CAJERO',
] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];

/**
 * Factory de guard funcional para limitar una ruta a un conjunto de roles.
 *
 * Uso:
 *   {
 *     path: 'admin',
 *     canActivate: [roleGuard(['ADMINISTRADOR'])],
 *   }
 *
 * Reglas:
 *   - Si el usuario no esta autenticado, delega en `authGuard`:
 *     redirige a `/login`. (Ya deberia estar protegido por `authGuard`
 *     en la cadena; este guard es defensivo.)
 *   - Si el usuario esta autenticado pero su rol no esta en la lista,
 *     redirige a `/login` con un mensaje amigable.
 *   - Side effect: si el rol es valido, refresca el currentUser si esta
 *     vacio (caso tipico al recargar la pagina).
 */
export function roleGuard(allowedRoles: readonly SystemRole[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // 1. Sin sesion: redirigir a login.
    const token = authService.getToken();
    if (!token || authService.isTokenExpired()) {
      authService.forceLogout();
      return router.createUrlTree(['/login']);
    }

    // 2. Sesion valida: si tenemos el rol en cache, validar; si no,
    //    esperar a /auth/me.
    const cachedUser = authService.currentUser();
    if (cachedUser) {
      return checkRole(cachedUser.role, allowedRoles, router);
    }

    // 3. Sin usuario en cache: rehidratar via /auth/me.
    return new Promise((resolve) => {
      authService.getMe().subscribe({
        next: (user) => resolve(checkRole(user.role, allowedRoles, router)),
        error: () => {
          authService.forceLogout();
          resolve(router.createUrlTree(['/login']));
        },
      });
    });
  };
}

/**
 * Helper que compara el rol del usuario contra la lista permitida.
 * Devuelve `true` si pasa, o un `UrlTree` apuntando a `/login` si no.
 */
function checkRole(
  userRole: string | undefined,
  allowedRoles: readonly SystemRole[],
  router: Router,
): boolean | ReturnType<Router['createUrlTree']> {
  if (userRole && allowedRoles.includes(userRole as SystemRole)) {
    return true;
  }
  // No autorizado: redirigir a login con un mensaje claro.
  try {
    sessionStorage.setItem(
      'ROLE_GUARD_MESSAGE',
      'Su rol no tiene permisos para acceder a esta seccion.',
    );
  } catch {
    // sessionStorage puede no estar disponible en SSR; ignorar.
  }
  return router.createUrlTree(['/login']);
}
