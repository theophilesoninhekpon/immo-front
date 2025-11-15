import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property.service';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-seller-properties',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seller-properties.component.html',
  styleUrl: './seller-properties.component.sass'
})
export class SellerPropertiesComponent implements OnInit {
  propertyService = inject(PropertyService);
  authService = inject(AuthService);

  properties: any[] = [];
  loading = true;
  currentUser: any = null;
  canCreateProperty = false;
  filters = {
    status: '',
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  };

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    // Un admin peut toujours créer des biens, ou un vendeur vérifié
    const isAdmin = this.authService.hasRole('admin');
    const isVerifiedSeller = this.currentUser && this.authService.hasRole('vendeur') && this.currentUser.verification_status === 'verified';
    this.canCreateProperty = isAdmin || isVerifiedSeller;
    this.loadProperties();
  }

  loadProperties(): void {
    this.loading = true;
    this.propertyService.getMyProperties(this.filters).subscribe({
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
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading properties:', err);
        this.properties = [];
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadProperties();
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'pending_verification': 'bg-yellow-100 text-yellow-800',
      'verified': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'draft': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'pending_verification': 'En attente',
      'verified': 'Vérifié',
      'rejected': 'Rejeté',
      'draft': 'Brouillon'
    };
    return labels[status] || status;
  }

  deleteProperty(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce bien ?')) {
      this.propertyService.deleteProperty(id).subscribe({
        next: () => {
          this.loadProperties();
        },
        error: (err) => {
          console.error('Error deleting property:', err);
          alert('Erreur lors de la suppression du bien');
        }
      });
    }
  }

  getMainImageUrl(property: any): string {
    if (!property.images || property.images.length === 0) {
      return '';
    }
    
    // Chercher l'image principale (is_main === true)
    const mainImage = property.images.find((img: any) => img.is_main === true);
    if (mainImage?.url) {
      return mainImage.url;
    }
    if (mainImage?.file_path) {
      const baseUrl = environment.apiUrl.replace('/api', '');
      return `${baseUrl}/storage/${mainImage.file_path}`;
    }
    
    // Si pas d'image principale, utiliser la première image
    if (property.images[0]?.url) {
      return property.images[0].url;
    }
    if (property.images[0]?.file_path) {
      const baseUrl = environment.apiUrl.replace('/api', '');
      return `${baseUrl}/storage/${property.images[0].file_path}`;
    }
    
    return '';
  }
}

