import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../core/auth/service/auth';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si está autenticado primero
  if (!authService.estaAutenticado()) {
    router.navigate(['/inicio']);
    return false;
  }

  // Obtener rol requerido de la ruta
  const rolRequerido = route.data['role'] as string;
  const rolUsuario = authService.obtenerRol();

  // Si no hay rol requerido, permitir acceso
  if (!rolRequerido) {
    return true;
  }

  // Verificar si el usuario tiene el rol correcto
  if (rolUsuario === rolRequerido) {
    return true;
  }

  // Si no tiene el rol correcto, redirigir según su rol
  console.warn(`Acceso denegado. Rol requerido: ${rolRequerido}, Rol usuario: ${rolUsuario}`);
  authService.navegarSegunRol();
  return false;
};
