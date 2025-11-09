import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property.service';
import { AuthService } from '../../../services/auth.service';
import { PropertyInterestService } from '../../../services/property-interest.service';
import { ServiceRequestService } from '../../../services/service-request.service';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seller-dashboard.component.html',
  styleUrl: './seller-dashboard.component.sass'
})
export class SellerDashboardComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private authService = inject(AuthService);
  private interestService = inject(PropertyInterestService);
  private serviceRequestService = inject(ServiceRequestService);

  stats: any = {
    total: 0,
    published: 0,
    pending: 0,
    rejected: 0,
    sold: 0
  };
  requestsCount = 0;
  serviceRequestsCount = 0;
  loading = true;
  user: any = null;
  canCreateProperty = false;

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    const isAdmin = this.authService.hasRole('admin');
    const isVerifiedSeller = this.user && this.authService.hasRole('vendeur') && this.user.verification_status === 'verified';
    this.canCreateProperty = isAdmin || isVerifiedSeller;
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.loading = true;
    
    // Charger les statistiques des propriétés
    this.propertyService.getMyProperties().subscribe({
      next: (response) => {
        if (response.success) {
          let allProperties: any[] = [];
          if (Array.isArray(response.data)) {
            allProperties = response.data;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            allProperties = response.data.data;
          }
          
          this.stats.total = allProperties.length;
          this.stats.published = allProperties.filter((p: any) => 
            p.status === 'available' || p.is_verified === true
          ).length;
          this.stats.pending = allProperties.filter((p: any) => 
            p.status === 'pending_verification' || (p.is_verified === false && p.status !== 'rejected')
          ).length;
          this.stats.rejected = allProperties.filter((p: any) => 
            p.status === 'rejected'
          ).length;
          this.stats.sold = allProperties.filter((p: any) => 
            p.status === 'sold'
          ).length;

          // Charger les demandes d'intérêt (l'API filtre automatiquement pour les vendeurs)
          this.loadInterestsCount();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    // Charger le nombre de demandes de service du vendeur
    this.loadServiceRequestsCount();
  }

  loadInterestsCount(): void {
    // L'API filtre automatiquement les demandes d'intérêt pour les vendeurs
    // On utilise le total de la pagination
    this.interestService.getInterests({ per_page: 1 }).subscribe({
      next: (response: any) => {
        if (response.success) {
          // L'API retourne déjà les demandes filtrées pour les propriétés du vendeur
          if (response.data?.total !== undefined) {
            this.requestsCount = response.data.total;
          } else if (Array.isArray(response.data)) {
            this.requestsCount = response.data.length;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            this.requestsCount = response.data.data.length;
          } else {
            this.requestsCount = 0;
          }
        } else {
          this.requestsCount = 0;
        }
      },
      error: () => {
        this.requestsCount = 0;
      }
    });
  }

  loadServiceRequestsCount(): void {
    // L'API filtre déjà automatiquement les demandes de service par user_id pour les non-admins
    // Donc on récupère directement le total depuis la réponse paginée
    this.serviceRequestService.getServiceRequests({ per_page: 1 }).subscribe({
      next: (response: any) => {
        if (response.success) {
          // L'API retourne déjà les demandes filtrées par user_id pour les non-admins
          // On utilise le total de la pagination
          if (response.data?.total !== undefined) {
            this.serviceRequestsCount = response.data.total;
          } else if (Array.isArray(response.data)) {
            this.serviceRequestsCount = response.data.length;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            this.serviceRequestsCount = response.data.data.length;
          } else {
            this.serviceRequestsCount = 0;
          }
        } else {
          this.serviceRequestsCount = 0;
        }
      },
      error: () => {
        this.serviceRequestsCount = 0;
      }
    });
  }
}

