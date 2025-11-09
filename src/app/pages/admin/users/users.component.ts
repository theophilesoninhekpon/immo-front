import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);

  users: any[] = [];
  loading = false;
  filters = {
    role: 'vendeur',
    verification_status: '',
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    per_page: 15
  };
  currentPage = 1;
  totalPages = 1;
  total = 0;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    const params = {
      ...this.filters,
      page: this.currentPage
    };
    
    this.userService.getUsers(params).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.data?.data) {
            this.users = response.data.data;
            this.currentPage = response.data.current_page || 1;
            this.totalPages = response.data.last_page || 1;
            this.total = response.data.total || 0;
          } else {
            this.users = response.data || [];
          }
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  resetFilters(): void {
    this.filters = {
      role: '',
      verification_status: '',
      search: '',
      sort_by: 'created_at',
      sort_order: 'desc',
      per_page: 15
    };
    this.currentPage = 1;
    this.loadUsers();
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'En attente',
      'verified': 'Vérifié',
      'rejected': 'Rejeté'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'verified': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-slate-100 text-slate-800';
  }

  getRoleLabel(roles: any[]): string {
    if (!roles || roles.length === 0) return 'Aucun';
    return roles.map((r: any) => r.name).join(', ');
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers();
    }
  }
}
