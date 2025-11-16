import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { verifiedSellerGuard } from './guards/verified-seller.guard';
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
        loadComponent: () => import('./pages/public/properties/public-properties.component').then(m => m.PublicPropertiesComponent)
      },
      {
        path: 'properties/:id',
        loadComponent: () => import('./pages/public/properties/public-property-detail.component').then(m => m.PublicPropertyDetailComponent)
      },
      {
        path: 'services',
        loadComponent: () => import('./pages/public/services/public-services.component').then(m => m.PublicServicesComponent)
      },
      {
        path: 'about',
        loadComponent: () => import('./pages/public/about/about.component').then(m => m.AboutComponent)
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
        path: 'sellers',
        loadComponent: () => import('./pages/admin/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'sellers/:id',
        loadComponent: () => import('./pages/admin/users/admin-seller-detail.component').then(m => m.AdminSellerDetailComponent)
      },
      {
        path: 'buyers',
        loadComponent: () => import('./pages/admin/users/buyers.component').then(m => m.BuyersComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/admin/users/all-users.component').then(m => m.AllUsersComponent)
      },
      {
        path: 'document-types',
        loadComponent: () => import('./pages/admin/document-types/document-types.component').then(m => m.DocumentTypesComponent)
      },
      {
        path: 'property-types',
        loadComponent: () => import('./pages/admin/property-types/property-types.component').then(m => m.PropertyTypesComponent)
      },
      {
        path: 'property-features',
        loadComponent: () => import('./pages/admin/property-features/property-features.component').then(m => m.PropertyFeaturesComponent)
      },
      {
        path: 'services',
        loadComponent: () => import('./pages/admin/services/services.component').then(m => m.ServicesComponent)
      },
      {
        path: 'property-interests',
        loadComponent: () => import('./pages/admin/requests/requests.component').then(m => m.RequestsComponent)
      },
      {
        path: 'service-requests',
        loadComponent: () => import('./pages/admin/service-requests/admin-service-requests.component').then(m => m.AdminServiceRequestsComponent)
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
    loadComponent: () => import('./components/dashboard/seller-dashboard-layout.component').then(m => m.SellerDashboardLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/seller/dashboard/seller-dashboard.component').then(m => m.SellerDashboardComponent)
      },
      {
        path: 'properties',
        loadComponent: () => import('./pages/seller/properties/seller-properties.component').then(m => m.SellerPropertiesComponent)
      },
      {
        path: 'properties/new',
        canActivate: [verifiedSellerGuard],
        loadComponent: () => import('./pages/seller/properties/create-property.component').then(m => m.CreatePropertyComponent)
      },
      {
        path: 'properties/:id',
        loadComponent: () => import('./pages/seller/properties/property-detail.component').then(m => m.PropertyDetailComponent)
      },
      {
        path: 'properties/:id/edit',
        loadComponent: () => import('./pages/seller/properties/edit-property.component').then(m => m.EditPropertyComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/seller/profile/seller-profile.component').then(m => m.SellerProfileComponent)
      },
      {
        path: 'services',
        loadComponent: () => import('./pages/seller/services/seller-services.component').then(m => m.SellerServicesComponent)
      }
    ]
  },
  {
    path: 'buyer',
    canActivate: [authGuard, roleGuard(['acheteur'])],
    loadComponent: () => import('./components/dashboard/buyer-dashboard-layout.component').then(m => m.BuyerDashboardLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/buyer/dashboard/buyer-dashboard.component').then(m => m.BuyerDashboardComponent)
      },
      {
        path: 'properties',
        loadComponent: () => import('./pages/buyer/properties/buyer-properties.component').then(m => m.BuyerPropertiesComponent)
      },
      {
        path: 'properties/:id',
        loadComponent: () => import('./pages/buyer/properties/buyer-property-detail.component').then(m => m.BuyerPropertyDetailComponent)
      },
      {
        path: 'requests',
        loadComponent: () => import('./pages/buyer/requests/buyer-requests.component').then(m => m.BuyerRequestsComponent)
      },
      {
        path: 'services',
        loadComponent: () => import('./pages/buyer/services/buyer-services.component').then(m => m.BuyerServicesComponent)
      }
    ]
  }
];
