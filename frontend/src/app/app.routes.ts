import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guard/auth-guard';
import { roleGuard } from './guards/role/role-guard';
import { adminGuard } from './guards/admin/admin-guard';
import { publicGuard } from './guards/public/public-guard';

export const routes: Routes = [
  // ============================================
  // RUTAS PÚBLICAS (sin autenticación)
  // ============================================
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full',
  },
  {
    path: 'inicio',
    loadComponent: () => import('./pages/pagina/inicio/inicio').then((m) => m.Inicio),
    title: 'Inicio',
    canActivate: [publicGuard],
  },
  {
    path: 'iniciar-sesion',
    loadComponent: () =>
      import('./pages/pagina/iniciar-sesion/iniciar-sesion').then((m) => m.IniciarSesion),
    title: 'Iniciar sesión',
    canActivate: [publicGuard],
  },
  {
    path: 'crear-cuenta',
    loadComponent: () =>
      import('./pages/pagina/crear-cuenta/crear-cuenta').then((m) => m.CrearCuenta),
    title: 'Crear cuenta',
    canActivate: [publicGuard],
  },
  {
    path: 'recuperar-contrasena',
    loadComponent: () =>
      import('./pages/pagina/recuperar-contrasena/recuperar-contrasena').then(
        (m) => m.RecuperarContrasena
      ),
    title: 'Recuperar contraseña',
    canActivate: [publicGuard],
  },
  {
    path: 'politicas-privacidad',
    loadComponent: () =>
      import('./pages/pagina/politicas-privacidad-pagina/politicas-privacidad-pagina').then(
        (m) => m.PoliticasPrivacidadPagina
      ),
    title: 'Políticas de privacidad',
    canActivate: [publicGuard],
  },
  {
    path: 'terminos-condiciones',
    loadComponent: () =>
      import('./pages/pagina/terminos-condiciones-pagina/terminos-condiciones-pagina').then(
        (m) => m.TerminosCondicionesPagina
      ),
    title: 'Términos y condiciones',
    canActivate: [publicGuard],
  },

  // ============================================
  // RUTAS DE APRENDIZ (con layout y sidebar)
  // ============================================
  {
    path: 'aprendiz',
    loadComponent: () =>
      import('./core/layout/plataforma-layout/plataforma-layout').then((m) => m.PlataformaLayout),
    canActivate: [authGuard, roleGuard],
    data: { role: 'aprendiz' },
    children: [
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
      {
        path: 'inicio',
        loadComponent: () =>
          import('./pages/aprendiz/inicio-aprendiz/inicio-aprendiz').then((m) => m.InicioAprendiz),
        title: 'Inicio - Aprendiz',
      },
      {
        path: 'simulador',
        loadComponent: () =>
          import('./pages/aprendiz/simulador/simulador').then((m) => m.Simulador),
        title: 'Simulador', // opcional (fallback)
        data: { headerText: 'Simulador de Asesoría Bancaria' }, // preferido ahora
      },
      {
        path: 'mi-personal',
        loadComponent: () =>
          import('./pages/aprendiz/mi-personal/mi-personal').then((m) => m.MiPersonal),
        title: 'Mi Personal',
      },
      {
        path: 'logros',
        loadComponent: () => import('./pages/aprendiz/logros/logros').then((m) => m.Logros),
        title: 'Logros',
      },
      {
        path: 'informacion-plataforma',
        loadComponent: () =>
          import('./pages/aprendiz-instructor/informacion-plataforma/informacion-plataforma').then(
            (m) => m.InformacionPlataforma
          ),
        title: 'Información de la plataforma',
      },
      {
        path: 'politicas-plataforma',
        loadComponent: () =>
          import('./pages/aprendiz-instructor/politicas-plataforma/politicas-plataforma').then(
            (m) => m.PoliticasPlataforma
          ),
        title: 'Políticas de la plataforma',
      },
    ],
  },

  // ============================================
  // RUTAS DE INSTRUCTOR (con layout y sidebar)
  // ============================================
  {
    path: 'instructor',
    loadComponent: () =>
      import('./core/layout/plataforma-layout/plataforma-layout').then((m) => m.PlataformaLayout),
    canActivate: [authGuard, roleGuard],
    data: { role: 'instructor' },
    children: [
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
      {
        path: 'inicio',
        loadComponent: () =>
          import('./pages/instructor/inicio-instructor/inicio-instructor').then(
            (m) => m.InicioInstructor
          ),
        title: 'Inicio - Instructor',
      },
      {
        path: 'informacion-plataforma',
        loadComponent: () =>
          import('./pages/aprendiz-instructor/informacion-plataforma/informacion-plataforma').then(
            (m) => m.InformacionPlataforma
          ),
        title: 'Información de la plataforma',
      },
      {
        path: 'politicas-plataforma',
        loadComponent: () =>
          import('./pages/aprendiz-instructor/politicas-plataforma/politicas-plataforma').then(
            (m) => m.PoliticasPlataforma
          ),
        title: 'Políticas de la plataforma',
      },
    ],
  },

  // ============================================
  // RUTAS DE ADMINISTRADOR (con layout y sidebar)
  // ============================================
  {
    path: 'administrador',
    loadComponent: () =>
      import('./core/layout/plataforma-layout/plataforma-layout').then((m) => m.PlataformaLayout),
    canActivate: [authGuard, adminGuard],
    data: { role: 'administrador' },
    children: [
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
      {
        path: 'inicio',
        loadComponent: () =>
          import('./pages/administrador/inicio-administrador/inicio-administrador').then(
            (m) => m.InicioAdministrador
          ),
        title: 'Inicio - Administrador',
      },
    ],
  },

  // ============================================
  // RUTAS ESPECIALES
  // ============================================
  {
    path: 'mantenimiento',
    loadComponent: () =>
      import('./shared/pages/maintenance/maintenance').then((m) => m.Maintenance),
    title: 'En mantenimiento',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/pages/not-found-error/not-found-error').then((m) => m.NotFoundError),
    title: 'Página no encontrada',
  },
];
