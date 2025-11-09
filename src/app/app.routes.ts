import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { LayoutComponent } from './components/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'properties',
        loadComponent: () => import('./pages/buyer/dashboard/buyer-dashboard.component').then(m => m.BuyerDashboardComponent)
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['admin'])],
    loadComponent: () => import('./components/dashboard/admin-dashboard-layout.component').then(m => m.AdminDashboardLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/admin/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'users/pending',
        loadComponent: () => import('./pages/admin/users/pending-users.component').then(m => m.PendingUsersComponent)
      },
      {
        path: 'properties',
        loadComponent: () => import('./pages/admin/properties/admin-properties.component').then(m => m.AdminPropertiesComponent)
      },
      {
        path: 'properties/new',
        loadComponent: () => import('./pages/seller/properties/create-property.component').then(m => m.CreatePropertyComponent)
      },
      {
        path: 'properties/:id',
        loadComponent: () => import('./pages/seller/properties/property-detail.component').then(m => m.PropertyDetailComponent)
      },
      {
        path: 'properties/:id/edit',
        loadComponent: () => import('./pages/seller/properties/edit-property.component').then(m => m.EditPropertyComponent)
      }
    ]
  },
  {
    path: 'seller',
    canActivate: [authGuard, roleGuard(['vendeur'])],
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/seller/dashboard/seller-dashboard.component').then(m => m.SellerDashboardComponent)
      },
      {
        path: 'properties/new',
        loadComponent: () => import('./pages/seller/properties/create-property.component').then(m => m.CreatePropertyComponent)
      },
      {
        path: 'properties/:id',
        loadComponent: () => import('./pages/seller/properties/property-detail.component').then(m => m.PropertyDetailComponent)
      },
      {
        path: 'properties/:id/edit',
        loadComponent: () => import('./pages/seller/properties/edit-property.component').then(m => m.EditPropertyComponent)
      }
    ]
  },
  {
    path: 'buyer',
    canActivate: [authGuard, roleGuard(['acheteur'])],
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/buyer/dashboard/buyer-dashboard.component').then(m => m.BuyerDashboardComponent)
      }
    ]
  }
];
