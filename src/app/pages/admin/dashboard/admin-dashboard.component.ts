import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { PropertyService } from '../../../services/property.service';
import { PropertyInterestService } from '../../../services/property-interest.service';
import { ServiceRequestService } from '../../../services/service-request.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.sass'
})
export class AdminDashboardComponent implements OnInit {
  private userService = inject(UserService);
  private propertyService = inject(PropertyService);
  private interestService = inject(PropertyInterestService);
  private serviceRequestService = inject(ServiceRequestService);

  stats: any = {
    users: {
      total: 0,
      sellers: 0,
      buyers: 0,
      verifiedSellers: 0,
      pendingSellers: 0,
      rejectedSellers: 0
    },
    properties: {
      total: 0,
      available: 0,
      published: 0,
      pending: 0,
      rejected: 0,
      sold: 0
    },
    requests: {
      total: 0,
      pending: 0
    },
    serviceRequests: {
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0
    }
  };
  loading = true;

  ngOnInit(): void {
    this.loadStatistics();
    // Rafraîchir les stats toutes les 30 secondes
    setInterval(() => {
      this.loadStatistics();
    }, 30000);
  }

  loadStatistics(): void {
    this.loading = true;
    
    // Charger les statistiques des utilisateurs
    this.userService.getUserStatistics().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats.users = {
            total: response.data?.total || 0,
            sellers: response.data?.sellers || 0,
            buyers: response.data?.buyers || 0,
            verifiedSellers: response.data?.verified_sellers || 0,
            pendingSellers: response.data?.pending_sellers || 0,
            rejectedSellers: response.data?.rejected_sellers || 0
          };
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    // Charger les statistiques des propriétés
    this.propertyService.getProperties({ per_page: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          // Pour obtenir le total, on utilise la pagination
          if (response.data?.total !== undefined) {
            this.stats.properties.total = response.data.total;
          }
        }
      }
    });

    // Charger les propriétés en attente
    // On compte uniquement les biens qui sont vraiment en attente de validation
    // C'est-à-dire ceux qui ont status='pending_verification' ET is_verified=false
    this.propertyService.getProperties({ status: 'pending_verification', is_verified: false, per_page: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.data?.total !== undefined) {
            this.stats.properties.pending = response.data.total;
          } else if (Array.isArray(response.data)) {
            // Filtrer pour ne garder que ceux vraiment en attente (non vérifiés)
            this.stats.properties.pending = response.data.filter((p: any) => {
              return p.status === 'pending_verification' && p.is_verified === false;
            }).length;
          } else if (response.data?.data) {
            this.stats.properties.pending = response.data.data.filter((p: any) => {
              return p.status === 'pending_verification' && p.is_verified === false;
            }).length;
          } else {
            this.stats.properties.pending = 0;
          }
        }
      }
    });

    // Charger les propriétés disponibles (actives et vérifiées)
    this.propertyService.getProperties({ is_active: true, is_verified: true, per_page: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.data?.total !== undefined) {
            this.stats.properties.available = response.data.total;
            this.stats.properties.published = response.data.total;
          }
        }
      }
    });

    // Charger les propriétés rejetées
    this.propertyService.getProperties({ status: 'rejected', per_page: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.data?.total !== undefined) {
            this.stats.properties.rejected = response.data.total;
          }
        }
      }
    });

    // Charger les propriétés vendues
    this.propertyService.getProperties({ status: 'sold', per_page: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.data?.total !== undefined) {
            this.stats.properties.sold = response.data.total;
          }
        }
      }
    });

    // Charger les statistiques des requêtes d'intérêt
    this.interestService.getStatistics().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats.requests = {
            total: response.data?.total || 0,
            pending: response.data?.pending || 0
          };
        }
      }
    });

    // Charger les statistiques des demandes de service
    this.serviceRequestService.getServiceRequests({ per_page: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          const total = response.data?.total || 0;
          this.stats.serviceRequests.total = total;
        }
      }
    });

    this.serviceRequestService.getServiceRequests({ status: 'pending', per_page: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          const pending = response.data?.total || 0;
          this.stats.serviceRequests.pending = pending;
        }
      }
    });

    this.serviceRequestService.getServiceRequests({ status: 'in_progress', per_page: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          const inProgress = response.data?.total || 0;
          this.stats.serviceRequests.in_progress = inProgress;
        }
      }
    });

    this.serviceRequestService.getServiceRequests({ status: 'completed', per_page: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          const completed = response.data?.total || 0;
          this.stats.serviceRequests.completed = completed;
        }
      }
    });
  }
}

