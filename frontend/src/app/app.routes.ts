import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
	},
	{
		path: 'products',
		loadComponent: () => import('./pages/products/product-list/product-list.component').then(m => m.ProductListComponent)
	},
	{
		path: 'products/:id',
		loadComponent: () => import('./pages/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
	},
	{
		path: 'profile',
		loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
	}
];
