import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PropertyInterestService } from '../../../services/property-interest.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './requests.component.html'
})
export class RequestsComponent implements OnInit {
  private interestService = inject(PropertyInterestService);
  private userService = inject(UserService);

  requests: any[] = [];
  loading = false;
  selectedRequest: any = null;
  filters = {
    status: '',
    property_id: '',
    user_id: '',
    unassigned: false,
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    per_page: 15
  };
  currentPage = 1;
  totalPages = 1;
  total = 0;
  users: any[] = [];
  updating = false;

  ngOnInit(): void {
    this.loadRequests();
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers({ role: 'admin', per_page: 100 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.data?.data || response.data || [];
        }
      }
    });
  }

  loadRequests(): void {
    this.loading = true;
    const params = {
      ...this.filters,
      page: this.currentPage
    };
    
    this.interestService.getInterests(params).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.data?.data) {
            this.requests = response.data.data;
            this.currentPage = response.data.current_page || 1;
            this.totalPages = response.data.last_page || 1;
            this.total = response.data.total || 0;
          } else {
            this.requests = response.data || [];
          }
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  selectRequest(request: any): void {
    this.selectedRequest = request;
  }

  updateStatus(requestId: number, status: string, notes?: string): void {
    this.updating = true;
    const data: any = { status };
    if (notes) {
      data.notes = notes;
    }
    
    this.interestService.updateInterest(requestId, data).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadRequests();
          this.selectedRequest = null;
        }
        this.updating = false;
      },
      error: () => {
        this.updating = false;
      }
    });
  }

  assignTo(requestId: number, userId: number): void {
    this.updating = true;
    this.interestService.updateInterest(requestId, { assigned_to: userId }).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadRequests();
          this.selectedRequest = null;
        }
        this.updating = false;
      },
      error: () => {
        this.updating = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadRequests();
  }

  resetFilters(): void {
    this.filters = {
      status: '',
      property_id: '',
      user_id: '',
      unassigned: false,
      search: '',
      sort_by: 'created_at',
      sort_order: 'desc',
      per_page: 15
    };
    this.currentPage = 1;
    this.loadRequests();
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'En attente',
      'contacted': 'Contacté',
      'interested': 'Intéressé',
      'not_interested': 'Non intéressé',
      'scheduled_visit': 'Visite programmée',
      'completed': 'Terminé'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'contacted': 'bg-blue-100 text-blue-800',
      'interested': 'bg-green-100 text-green-800',
      'not_interested': 'bg-red-100 text-red-800',
      'scheduled_visit': 'bg-purple-100 text-purple-800',
      'completed': 'bg-slate-100 text-slate-800'
    };
    return classes[status] || 'bg-slate-100 text-slate-800';
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadRequests();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadRequests();
    }
  }
}

