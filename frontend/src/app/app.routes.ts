import { Routes } from '@angular/router';

export const routes: Routes = [
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
];
