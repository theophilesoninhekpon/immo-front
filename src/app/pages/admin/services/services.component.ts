import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ServiceService } from '../../../services/service.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './services.component.html'
})
export class ServicesComponent implements OnInit {
  private serviceService = inject(ServiceService);

  services: any[] = [];
  loading = false;
  showForm = false;
  editingService: any = null;
  formData = {
    name: '',
    code: '',
    description: '',
    category: 'basic',
    price: null as number | null,
    pricing_type: 'free',
    features: [] as string[],
    requirements: '',
    duration_days: null as number | null,
    sort_order: 0,
    is_active: true,
    is_featured: false
  };
  newFeature = '';
  filters = {
    is_active: '',
    category: '',
    pricing_type: '',
    search: ''
  };

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.loading = true;
    this.serviceService.getServices(this.filters).subscribe({
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

  openForm(service?: any): void {
    if (service) {
      this.editingService = service;
      this.formData = {
        name: service.name || '',
        code: service.code || '',
        description: service.description || '',
        category: service.category || 'basic',
        price: service.price || null,
        pricing_type: service.pricing_type || 'free',
        features: Array.isArray(service.features) ? [...service.features] : [],
        requirements: service.requirements || '',
        duration_days: service.duration_days || null,
        sort_order: service.sort_order || 0,
        is_active: service.is_active !== undefined ? service.is_active : true,
        is_featured: service.is_featured || false
      };
    } else {
      this.editingService = null;
      this.formData = {
        name: '',
        code: '',
        description: '',
        category: 'basic',
        price: null,
        pricing_type: 'free',
        features: [],
        requirements: '',
        duration_days: null,
        sort_order: 0,
        is_active: true,
        is_featured: false
      };
    }
    this.newFeature = '';
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingService = null;
  }

  addFeature(): void {
    if (this.newFeature.trim()) {
      this.formData.features.push(this.newFeature.trim());
      this.newFeature = '';
    }
  }

  removeFeature(index: number): void {
    this.formData.features.splice(index, 1);
  }

  saveService(): void {
    if (!this.formData.name.trim()) {
      alert('Le nom est requis');
      return;
    }

    // Si pricing_type est 'free', le prix doit être 0
    if (this.formData.pricing_type === 'free') {
      this.formData.price = 0;
    }

    this.loading = true;
    const request = this.editingService
      ? this.serviceService.updateService(this.editingService.id, this.formData)
      : this.serviceService.createService(this.formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.loadServices();
          this.closeForm();
        } else {
          alert('Erreur: ' + (response.message || 'Erreur inconnue'));
        }
        this.loading = false;
      },
      error: (error) => {
        alert('Erreur: ' + (error.error?.message || 'Erreur inconnue'));
        this.loading = false;
      }
    });
  }

  deleteService(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      this.loading = true;
      this.serviceService.deleteService(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadServices();
          } else {
            alert('Erreur: ' + (response.message || 'Erreur inconnue'));
          }
          this.loading = false;
        },
        error: (error) => {
          alert('Erreur: ' + (error.error?.message || 'Erreur inconnue'));
          this.loading = false;
        }
      });
    }
  }

  toggleStatus(id: number): void {
    this.serviceService.toggleServiceStatus(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadServices();
        }
      }
    });
  }

  applyFilters(): void {
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

