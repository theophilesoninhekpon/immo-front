import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PropertyInterestService } from '../../../services/property-interest.service';
import { PropertyService } from '../../../services/property.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-seller-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seller-requests.component.html',
  styleUrl: './seller-requests.component.sass'
})
export class SellerRequestsComponent implements OnInit {
  private interestService = inject(PropertyInterestService);
  private propertyService = inject(PropertyService);
  private authService = inject(AuthService);

  requests: any[] = [];
  properties: any[] = [];
  loading = true;
  filters = {
    property_id: '',
    status: '',
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  };

  ngOnInit(): void {
    this.loadProperties();
    // L'API filtre automatiquement, donc on peut charger les demandes en parallèle
    this.loadRequests();
  }

  loadProperties(): void {
    this.propertyService.getMyProperties().subscribe({
      next: (response) => {
        if (response.success) {
          // Gérer la pagination
          if (Array.isArray(response.data)) {
            this.properties = response.data;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            this.properties = response.data.data;
          } else {
            this.properties = [];
          }
        } else {
          this.properties = [];
        }
      },
      error: () => {
        this.properties = [];
      }
    });
  }

  loadRequests(): void {
    this.loading = true;
    const params: any = {
      ...this.filters
    };
    
    // Si un bien spécifique est sélectionné, filtrer par ce bien
    if (this.filters.property_id) {
      params.property_id = this.filters.property_id;
    }

    // L'API filtre automatiquement pour les vendeurs (demandes pour leurs propriétés)
    this.interestService.getInterests(params).subscribe({
      next: (response) => {
        if (response.success) {
          // Gérer différents formats de réponse
          if (response.data?.data && Array.isArray(response.data.data)) {
            this.requests = response.data.data;
          } else if (Array.isArray(response.data)) {
            this.requests = response.data;
          } else {
            this.requests = [];
          }
        } else {
          this.requests = [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading requests:', err);
        this.requests = [];
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadRequests();
  }

  updateRequestStatus(requestId: number, status: string): void {
    this.interestService.updateInterest(requestId, { status }).subscribe({
      next: () => {
        this.loadRequests();
      },
      error: (err) => {
        console.error('Error updating request:', err);
        alert('Erreur lors de la mise à jour de la demande d\'intérêt');
      }
    });
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'contacted': 'bg-blue-100 text-blue-800',
      'interested': 'bg-green-100 text-green-800',
      'not_interested': 'bg-red-100 text-red-800',
      'scheduled_visit': 'bg-blue-100 text-blue-800',
      'completed': 'bg-slate-100 text-slate-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'pending': 'En attente',
      'contacted': 'Contacté',
      'interested': 'Intéressé',
      'not_interested': 'Non intéressé',
      'scheduled_visit': 'Visite programmée',
      'completed': 'Terminé'
    };
    return labels[status] || status;
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

