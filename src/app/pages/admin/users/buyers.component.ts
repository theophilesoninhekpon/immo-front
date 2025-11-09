import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-buyers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './buyers.component.html'
})
export class BuyersComponent implements OnInit {
  private userService = inject(UserService);

  buyers: any[] = [];
  loading = false;
  filters = {
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    per_page: 15
  };
  currentPage = 1;
  totalPages = 1;
  total = 0;

  ngOnInit(): void {
    this.loadBuyers();
  }

  loadBuyers(): void {
    this.loading = true;
    const params = {
      ...this.filters,
      role: 'acheteur',
      page: this.currentPage
    };
    
    this.userService.getUsers(params).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.data?.data) {
            this.buyers = response.data.data;
            this.currentPage = response.data.current_page || 1;
            this.totalPages = response.data.last_page || 1;
            this.total = response.data.total || 0;
          } else {
            this.buyers = response.data || [];
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
    this.loadBuyers();
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      sort_by: 'created_at',
      sort_order: 'desc',
      per_page: 15
    };
    this.currentPage = 1;
    this.loadBuyers();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadBuyers();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadBuyers();
    }
  }
}

