import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../service/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService); //inject nueva forma de inyectar dependencias sin utilizar un constructor
  const router = inject(Router); // Inyecta el servicio de enrutamiento para redirigir si no está autenticado

  if (authService.estaAutenticado()) {
    return true; // Usuario autenticado, permite acceso
  } else {
    // Si no está autenticado, redirigir a la página principal
    router.navigate(['/inicio'], { replaceUrl: true });
    return false;
  }
};
