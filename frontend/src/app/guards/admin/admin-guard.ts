import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../core/auth/service/auth';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si está autenticado
  if (!authService.estaAutenticado()) {
    router.navigate(['/inicio']);
    return false;
  }

  // Verificar si es administrador
  if (authService.esAdministrador()) {
    return true;
  }

  // Si no es admin, redirigir según su rol
  authService.navegarSegunRol();
  return false;
};
