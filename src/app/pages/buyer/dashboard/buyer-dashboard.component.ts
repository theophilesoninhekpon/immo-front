import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property.service';
import { PropertyInterestService } from '../../../services/property-interest.service';
import { ServiceRequestService } from '../../../services/service-request.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-buyer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  templateUrl: './buyer-dashboard.component.html',
  styleUrl: './buyer-dashboard.component.sass'
})
export class BuyerDashboardComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private interestService = inject(PropertyInterestService);
  private serviceRequestService = inject(ServiceRequestService);

  properties: any[] = [];
  myRequestsCount = 0;
  myServiceRequestsCount = 0;
  availablePropertiesCount = 0;
  loading = true;

  ngOnInit(): void {
    this.loadProperties();
    this.loadMyRequestsCount();
    this.loadMyServiceRequestsCount();
    this.loadAvailablePropertiesCount();
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
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadMyRequestsCount(): void {
    this.interestService.getInterests({ per_page: 1 }).subscribe({
      next: (response: any) => {
        if (response.success) {
          if (response.data?.total !== undefined) {
            this.myRequestsCount = response.data.total;
          } else if (Array.isArray(response.data)) {
            this.myRequestsCount = response.data.length;
          } else if (response.data?.data) {
            this.myRequestsCount = response.data.data.length;
          }
        }
      }
    });
  }

  loadMyServiceRequestsCount(): void {
    this.serviceRequestService.getServiceRequests({ per_page: 1 }).subscribe({
      next: (response: any) => {
        if (response.success) {
          if (response.data?.total !== undefined) {
            this.myServiceRequestsCount = response.data.total;
          } else if (Array.isArray(response.data)) {
            this.myServiceRequestsCount = response.data.length;
          } else if (response.data?.data) {
            this.myServiceRequestsCount = response.data.data.length;
          }
        }
      }
    });
  }

  loadAvailablePropertiesCount(): void {
    this.propertyService.getProperties({ 
      is_active: true, 
      is_verified: true, 
      per_page: 1 
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          if (response.data?.total !== undefined) {
            this.availablePropertiesCount = response.data.total;
          } else if (Array.isArray(response.data)) {
            this.availablePropertiesCount = response.data.length;
          } else if (response.data?.data) {
            this.availablePropertiesCount = response.data.data.length;
          }
        }
      }
    });
  }

  getPropertyImageUrl(property: any): string {
    if (!property.images || property.images.length === 0) {
      return '';
    }
    
    // Chercher l'image principale (is_main === true)
    const mainImage = property.images.find((img: any) => img.is_main === true);
    if (mainImage && mainImage.file_path) {
      const baseUrl = environment.apiUrl.replace('/api', '');
      return `${baseUrl}/storage/${mainImage.file_path}`;
    }
    
    // Si pas d'image principale, utiliser la première image
    if (property.images[0] && property.images[0].file_path) {
      const baseUrl = environment.apiUrl.replace('/api', '');
      return `${baseUrl}/storage/${property.images[0].file_path}`;
    }
    
    return '';
  }
}

