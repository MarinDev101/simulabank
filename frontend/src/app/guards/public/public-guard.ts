import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@app/core/auth/service/auth';

/**
 * Guard para rutas públicas (como login/registro)
 * Si el usuario ya está autenticado, lo redirige a su página correspondiente según su rol
 * Esto previene que un usuario logueado acceda a páginas de login, registro, etc.
 */
export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si ya está autenticado, redirigir a su página correspondiente según su rol
  if (authService.estaAutenticado()) {
    const usuario = authService.obtenerUsuario();

    // Si hay datos del usuario, redirigir según el rol
    if (usuario && usuario.rol) {
      switch (usuario.rol) {
        case 'administrador':
          router.navigate(['/administrador/inicio'], { replaceUrl: true });
          break;
        case 'instructor':
          router.navigate(['/instructor/inicio'], { replaceUrl: true });
          break;
        case 'aprendiz':
          router.navigate(['/aprendiz/inicio'], { replaceUrl: true });
          break;
        default:
          // Si el rol no es reconocido, limpiar sesión y permitir acceso
          return true;
      }
      return false;
    }

    // Si hay token pero no hay datos de usuario, usar el método del servicio
    authService.navegarSegunRol();
    return false;
  }

  // Si no está autenticado, permitir acceso a las páginas públicas
  return true;
};
