import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PropertyInterestService } from '../../../services/property-interest.service';

@Component({
  selector: 'app-buyer-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './buyer-requests.component.html',
  styleUrl: './buyer-requests.component.sass'
})
export class BuyerRequestsComponent implements OnInit {
  private interestService = inject(PropertyInterestService);

  requests: any[] = [];
  loading = true;
  filters = {
    status: '',
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  };

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    const params: any = {
      ...this.filters
    };

    this.interestService.getInterests(params).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.data?.data) {
            this.requests = response.data.data;
          } else {
            this.requests = Array.isArray(response.data) ? response.data : [];
          }
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading requests:', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadRequests();
  }

  deleteRequest(requestId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette requête ?')) {
      return;
    }

    this.interestService.deleteInterest(requestId).subscribe({
      next: () => {
        this.loadRequests();
      },
      error: (err) => {
        console.error('Error deleting request:', err);
        alert('Erreur lors de la suppression de la requête');
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

