import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/service/auth';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

// Flag para evitar múltiples redirecciones durante refresh fallido
let isRedirecting = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // URLs que no requieren token
  const skipAuth = ['/login', '/register', '/refresh'].some((url) => req.url.includes(url));

  if (skipAuth) {
    return next(req);
  }

  // URLs donde un error 401 NO debe causar logout (operaciones en background)
  const skipLogoutOnError = ['/perfil'].some((url) => req.url.includes(url));

  // Agregar token si existe
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error) => {
      // Si es error 401 y no estamos en refresh, intentar refrescar token
      if (error.status === 401 && !req.url.includes('/refresh')) {
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Reintentar request con nuevo token
            const newToken = authService.getToken();
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });
            return next(newReq);
          }),
          catchError((refreshError) => {
            // Si es una petición de background (como /perfil), no hacer logout
            // Solo propagar el error silenciosamente
            if (skipLogoutOnError) {
              return throwError(() => refreshError);
            }

            // Si falla el refresh y no estamos ya redirigiendo, cerrar sesión
            // Solo redirigir si el usuario no está en una ruta pública
            if (!isRedirecting) {
              isRedirecting = true;
              const rutasPublicas = ['/inicio', '/iniciar-sesion', '/crear-cuenta', '/recuperar-contrasena'];
              const rutaActual = router.url;
              const esRutaPublica = rutasPublicas.some(ruta => rutaActual.startsWith(ruta));

              if (!esRutaPublica) {
                authService.logout().subscribe({
                  complete: () => {
                    isRedirecting = false;
                  },
                  error: () => {
                    isRedirecting = false;
                  }
                });
              } else {
                isRedirecting = false;
              }
            }
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
