import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Guard para modo mantenimiento
 * Si maintenanceMode es true en environment, redirige a la página de mantenimiento
 */
export const maintenanceGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Si está en modo mantenimiento y no es la ruta de mantenimiento, redirigir
  if (environment.maintenanceMode && state.url !== '/mantenimiento') {
    router.navigate(['/mantenimiento']);
    return false;
  }

  return true;
};

/**
 * Guard para la página de mantenimiento
 * Solo permite acceso si el modo mantenimiento está activo
 */
export const maintenancePageGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Si NO está en modo mantenimiento, redirigir al inicio
  if (!environment.maintenanceMode) {
    router.navigate(['/inicio']);
    return false;
  }

  return true;
};
