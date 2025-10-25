import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth/auth-guard';
import { roleGuard } from './guards/role/role-guard';
import { adminGuard } from './guards/admin/admin-guard';

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
  },
  {
    path: 'iniciar-sesion',
    loadComponent: () =>
      import('./pages/pagina/iniciar-sesion/iniciar-sesion').then((m) => m.IniciarSesion),
    title: 'Iniciar sesión',
  },
  {
    path: 'politicas-privacidad',
    loadComponent: () =>
      import('./pages/pagina/politicas-privacidad-pagina/politicas-privacidad-pagina').then(
        (m) => m.PoliticasPrivacidadPagina
      ),
    title: 'Políticas de privacidad',
  },
  {
    path: 'terminos-condiciones',
    loadComponent: () =>
      import('./pages/pagina/terminos-condiciones-pagina/terminos-condiciones-pagina').then(
        (m) => m.TerminosCondicionesPagina
      ),
    title: 'Términos y condiciones',
  },

  // ============================================
  // RUTAS DE APRENDIZ (con layout y sidebar)
  // ============================================
  {
    path: 'aprendiz',
    loadComponent: () =>
      import('./core/layout/plataforma-layout/plataforma-layout').then((m) => m.PlataformaLayout),
    canActivate: [], // [authGuard, roleGuard], data: { roles: ['aprendiz'] }
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
        path: 'configuracion-simulacion',
        loadComponent: () =>
          import('./pages/aprendiz/configuracion-simulacion/configuracion-simulacion').then(
            (m) => m.ConfiguracionSimulacion
          ),
        title: 'Configuración de simulación',
      },
      {
        path: 'simulador',
        loadComponent: () =>
          import('./pages/aprendiz/simulador-plataforma/simulador-plataforma').then(
            (m) => m.SimuladorPlataforma
          ),
        title: 'Simulador',
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
    canActivate: [], // [authGuard, roleGuard], data: { roles: ['instructor'] }
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
    canActivate: [], // [authGuard, roleGuard], data: { roles: ['administrador'] }
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
