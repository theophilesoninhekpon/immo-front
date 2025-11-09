import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceService } from '../../../services/service.service';
import { ServiceRequestService } from '../../../services/service-request.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-buyer-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buyer-services.component.html'
})
export class BuyerServicesComponent implements OnInit {
  private serviceService = inject(ServiceService);
  private serviceRequestService = inject(ServiceRequestService);
  private authService = inject(AuthService);

  activeTab: 'available' | 'requests' = 'available';
  
  // Services disponibles
  services: any[] = [];
  loadingServices = false;
  filters = {
    category: '',
    pricing_type: '',
    search: ''
  };

  // Demandes de service
  serviceRequests: any[] = [];
  loadingRequests = false;
  requestFilters = {
    status: '',
    search: ''
  };

  // Modal de demande
  showRequestModal = false;
  selectedService: any = null;
  requestForm = {
    service_id: null as number | null,
    property_id: null as number | null,
    description: '',
    requirements: ''
  };
  submittingRequest = false;
  validationErrors: any = {};

  ngOnInit(): void {
    this.loadServices();
    this.loadServiceRequests();
  }

  loadServices(): void {
    this.loadingServices = true;
    const params: any = { is_active: true };
    if (this.filters.category) params.category = this.filters.category;
    if (this.filters.pricing_type) params.pricing_type = this.filters.pricing_type;
    if (this.filters.search) params.search = this.filters.search;

    this.serviceService.getServices(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.services = response.data?.data || response.data || [];
        }
        this.loadingServices = false;
      },
      error: () => {
        this.loadingServices = false;
      }
    });
  }

  loadServiceRequests(): void {
    this.loadingRequests = true;
    const params: any = {};
    if (this.requestFilters.status) params.status = this.requestFilters.status;
    if (this.requestFilters.search) params.search = this.requestFilters.search;

    this.serviceRequestService.getServiceRequests(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.serviceRequests = response.data?.data || response.data || [];
        }
        this.loadingRequests = false;
      },
      error: () => {
        this.loadingRequests = false;
      }
    });
  }

  openRequestModal(service: any): void {
    this.selectedService = service;
    this.requestForm = {
      service_id: service.id,
      property_id: null,
      description: '',
      requirements: ''
    };
    this.validationErrors = {};
    this.showRequestModal = true;
  }

  closeRequestModal(): void {
    this.showRequestModal = false;
    this.selectedService = null;
  }

  submitRequest(): void {
    // Reset validation errors
    this.validationErrors = {};

    // Frontend validation
    if (!this.requestForm.description.trim()) {
      this.validationErrors.description = 'La description est requise';
      return;
    }

    if (this.requestForm.description.trim().length < 10) {
      this.validationErrors.description = 'La description doit contenir au moins 10 caractères';
      return;
    }

    if (!this.requestForm.service_id) {
      this.validationErrors.service_id = 'Le service est requis';
      return;
    }

    this.submittingRequest = true;
    this.serviceRequestService.createServiceRequest(this.requestForm).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Demande de service créée avec succès');
          this.closeRequestModal();
          this.loadServiceRequests();
          this.activeTab = 'requests';
        } else {
          // Handle backend validation errors
          if (response.errors) {
            this.validationErrors = response.errors;
          } else {
            alert('Erreur: ' + (response.message || 'Erreur inconnue'));
          }
        }
        this.submittingRequest = false;
      },
      error: (error) => {
        // Handle backend validation errors
        if (error.error?.errors) {
          this.validationErrors = error.error.errors;
        } else {
          alert('Erreur: ' + (error.error?.message || 'Erreur inconnue'));
        }
        this.submittingRequest = false;
      }
    });
  }

  cancelRequest(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) {
      this.serviceRequestService.deleteServiceRequest(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadServiceRequests();
          } else {
            alert('Erreur: ' + (response.message || 'Erreur inconnue'));
          }
        },
        error: (error) => {
          alert('Erreur: ' + (error.error?.message || 'Erreur inconnue'));
        }
      });
    }
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'on_hold': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'pending': 'En attente',
      'in_progress': 'En cours',
      'completed': 'Terminé',
      'cancelled': 'Annulé',
      'on_hold': 'En pause'
    };
    return labels[status] || status;
  }

  getPricingStatusClass(status: string): string {
    const classes: any = {
      'pending': 'bg-gray-100 text-gray-800',
      'quoted': 'bg-blue-100 text-blue-800',
      'accepted': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getPricingStatusLabel(status: string): string {
    const labels: any = {
      'pending': 'En attente de devis',
      'quoted': 'Devis reçu',
      'accepted': 'Devis accepté',
      'rejected': 'Devis rejeté'
    };
    return labels[status] || status;
  }

  formatPrice(price: number | null): string {
    if (!price) return 'Non défini';
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getCategoryLabel(category: string): string {
    const labels: any = {
      'basic': 'Basique',
      'premium': 'Premium',
      'custom': 'Personnalisé'
    };
    return labels[category] || category;
  }

  getPricingTypeLabel(type: string): string {
    const labels: any = {
      'free': 'Gratuit',
      'fixed': 'Fixe',
      'negotiable': 'Négociable'
    };
    return labels[type] || type;
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }
}

