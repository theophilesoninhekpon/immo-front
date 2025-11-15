import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PropertyService } from '../../services/property.service';
import { ServiceService } from '../../services/service.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.sass'
})
export class HomeComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private serviceService = inject(ServiceService);

  properties: any[] = [];
  services: any[] = [];
  loadingProperties = true;
  loadingServices = true;

  ngOnInit(): void {
    this.loadProperties();
    this.loadServices();
  }

  loadProperties(): void {
    this.propertyService.getProperties({ 
      is_active: true, 
      is_verified: true, 
      per_page: 6,
      sort_by: 'created_at',
      sort_order: 'desc'
    }).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.data?.data) {
            this.properties = response.data.data;
          } else {
            this.properties = Array.isArray(response.data) ? response.data : [];
          }
        }
        this.loadingProperties = false;
      },
      error: () => {
        this.loadingProperties = false;
      }
    });
  }

  loadServices(): void {
    this.serviceService.getServices({ is_active: true, per_page: 6 }).subscribe({
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

  getPropertyImageUrl(property: any): string {
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

  getCategoryLabel(category: string): string {
    const labels: any = {
      'basic': 'Basique',
      'premium': 'Premium',
      'custom': 'Personnalisé'
    };
    return labels[category] || category;
  }
}

