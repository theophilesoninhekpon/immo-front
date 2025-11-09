import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceRequestService } from '../../../services/service-request.service';
import { ServiceService } from '../../../services/service.service';

@Component({
  selector: 'app-admin-service-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-service-requests.component.html'
})
export class AdminServiceRequestsComponent implements OnInit {
  private serviceRequestService = inject(ServiceRequestService);
  private serviceService = inject(ServiceService);

  serviceRequests: any[] = [];
  loading = false;
  filters = {
    status: '',
    service_id: '',
    user_id: '',
    search: ''
  };
  services: any[] = [];
  selectedRequest: any = null;
  showQuoteModal = false;
  quoteForm = {
    quoted_price: null as number | null,
    notes: ''
  };
  showStatusModal = false;
  statusForm = {
    status: '',
    notes: ''
  };

  ngOnInit(): void {
    this.loadServiceRequests();
    this.loadServices();
  }

  loadServiceRequests(): void {
    this.loading = true;
    const params: any = {};
    if (this.filters.status) params.status = this.filters.status;
    if (this.filters.service_id) params.service_id = this.filters.service_id;
    if (this.filters.user_id) params.user_id = this.filters.user_id;
    if (this.filters.search) params.search = this.filters.search;

    this.serviceRequestService.getServiceRequests(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.serviceRequests = response.data?.data || response.data || [];
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadServices(): void {
    this.serviceService.getServices({ is_active: true, per_page: 100 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.services = response.data?.data || response.data || [];
        }
      }
    });
  }

  openQuoteModal(request: any): void {
    this.selectedRequest = request;
    this.quoteForm = {
      quoted_price: request.quoted_price || null,
      notes: ''
    };
    this.showQuoteModal = true;
  }

  closeQuoteModal(): void {
    this.showQuoteModal = false;
    this.selectedRequest = null;
  }

  submitQuote(): void {
    if (!this.quoteForm.quoted_price || !this.selectedRequest) {
      alert('Veuillez entrer un prix');
      return;
    }

    this.serviceRequestService.quotePrice(this.selectedRequest.id, this.quoteForm.quoted_price, this.quoteForm.notes).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Prix cité avec succès');
          this.closeQuoteModal();
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

  openStatusModal(request: any): void {
    this.selectedRequest = request;
    this.statusForm = {
      status: request.status,
      notes: request.notes || ''
    };
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedRequest = null;
  }

  submitStatus(): void {
    if (!this.statusForm.status || !this.selectedRequest) {
      alert('Veuillez sélectionner un statut');
      return;
    }

    this.serviceRequestService.updateStatus(this.selectedRequest.id, this.statusForm.status, this.statusForm.notes).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Statut mis à jour avec succès');
          this.closeStatusModal();
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

