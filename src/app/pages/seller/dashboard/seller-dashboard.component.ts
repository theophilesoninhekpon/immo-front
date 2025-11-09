import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  templateUrl: './seller-dashboard.component.html',
  styleUrl: './seller-dashboard.component.sass'
})
export class SellerDashboardComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private authService = inject(AuthService);

  properties: any[] = [];
  loading = true;
  user: any = null;

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadMyProperties();
  }

  loadMyProperties(): void {
    this.propertyService.getMyProperties().subscribe({
      next: (response) => {
        if (response.success) {
          this.properties = response.data || [];
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'available': 'status-available',
      'pending_verification': 'status-pending',
      'sold': 'status-sold',
      'rejected': 'status-rejected'
    };
    return classes[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'available': 'Disponible',
      'pending_verification': 'En attente',
      'sold': 'Vendu',
      'rejected': 'Rejeté'
    };
    return labels[status] || status;
  }
}

