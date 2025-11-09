import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ServiceService } from '../../../services/service.service';

@Component({
  selector: 'app-public-services',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './public-services.component.html',
  styleUrl: './public-services.component.sass'
})
export class PublicServicesComponent implements OnInit {
  private serviceService = inject(ServiceService);

  services: any[] = [];
  loading = false;
  filters = {
    category: '',
    pricing_type: '',
    search: ''
  };

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.loading = true;
    const params: any = { is_active: true };
    if (this.filters.category) params.category = this.filters.category;
    if (this.filters.pricing_type) params.pricing_type = this.filters.pricing_type;
    if (this.filters.search) params.search = this.filters.search;

    this.serviceService.getServices(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.services = response.data?.data || response.data || [];
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadServices();
  }

  resetFilters(): void {
    this.filters = {
      category: '',
      pricing_type: '',
      search: ''
    };
    this.loadServices();
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
}

