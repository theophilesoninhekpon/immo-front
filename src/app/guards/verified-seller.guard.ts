import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const verifiedSellerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const user = authService.getCurrentUser();
  
  // Les admins peuvent toujours créer des biens
  if (authService.hasRole('admin')) {
    return true;
  }

  // Vérifier si l'utilisateur est un vendeur
  if (!authService.hasRole('vendeur')) {
    router.navigate(['/unauthorized']);
    return false;
  }

  // Vérifier si le vendeur est vérifié
  if (user?.verification_status !== 'verified') {
    router.navigate(['/seller/profile'], { 
      queryParams: { 
        message: 'Vous devez être vérifié par un administrateur avant de pouvoir ajouter un bien. Veuillez compléter votre profil et attendre la validation.' 
      } 
    });
    return false;
  }

  return true;
};

