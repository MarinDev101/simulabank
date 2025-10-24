import { Routes } from '@angular/router';

export const routes: Routes = [
  // Public routes (no sidebar)
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio),
    title: 'Inicio',
  },
  {
    path: 'iniciar-sesion',
    loadComponent: () =>
      import('./pages/iniciar-sesion/iniciar-sesion').then((m) => m.IniciarSesion),
    title: 'Iniciar sesión',
    canActivate: [],
  },

  // Platform routes that should keep the sidebar: use a layout component with children
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/plataforma-layout/plataforma-layout').then((m) => m.PlataformaLayout),
    children: [
      {
        path: 'inicio-aprendiz',
        loadComponent: () =>
          import('./pages/inicio-aprendiz/inicio-aprendiz').then((m) => m.InicioAprendiz),
        title: 'Inicio aprendiz',
        canActivate: [],
      },
      {
        path: 'configuracion-simulacion',
        loadComponent: () =>
          import('./pages/configuracion-simulacion/configuracion-simulacion').then(
            (m) => m.ConfiguracionSimulacion
          ),
        title: 'Configuracion simulacion',
        canActivate: [],
      },
      {
        path: 'informacion-plataforma',
        loadComponent: () =>
          import('./pages/informacion-plataforma/informacion-plataforma').then(
            (m) => m.InformacionPlataforma
          ),
        title: 'Informacion plataforma',
        canActivate: [],
      },
      {
        path: 'politicas-plataforma',
        loadComponent: () =>
          import('./pages/politicas-plataforma/politicas-plataforma').then(
            (m) => m.PoliticasPlataforma
          ),
        title: 'Politicas plataforma',
        canActivate: [],
      },
      {
        path: 'simulador-plataforma',
        loadComponent: () =>
          import('./pages/simulador-plataforma/simulador-plataforma').then(
            (m) => m.SimuladorPlataforma
          ),
        title: 'Simulador plataforma',
        canActivate: [],
      },
      {
        path: 'products',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/products/product-list/product-list').then((m) => m.ProductList),
            title: 'Productos',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./pages/products/product-detail/product-detail').then((m) => m.ProductDetail),
            title: 'Detalle del producto',
          },
        ],
      },
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
    ],
  },
];
