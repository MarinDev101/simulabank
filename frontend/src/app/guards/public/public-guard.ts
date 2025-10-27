import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@app/core/auth/service/auth';

/**
 * Guard para rutas públicas (como login/registro)
 * Si el usuario ya está autenticado, lo redirige a su pagina correspondiente segun su rol
 */
export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si ya está autenticado, redirigir a su pagina correspondiente
  if (authService.estaAutenticado()) {
    authService.navegarSegunRol();
    return false;
  }

  // Si no está autenticado, permitir acceso
  return true;
};
