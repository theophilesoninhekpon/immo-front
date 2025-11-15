import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property.service';
import { LocationService } from '../../../services/location.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-buyer-properties',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DecimalPipe],
  templateUrl: './buyer-properties.component.html',
  styleUrl: './buyer-properties.component.sass'
})
export class BuyerPropertiesComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private locationService = inject(LocationService);

  properties: any[] = [];
  loading = true;
  filters = {
    search: '',
    property_type_id: '',
    min_price: '',
    max_price: '',
    min_surface: '',
    max_surface: '',
    bedrooms: '',
    bathrooms: '',
    department_id: '',
    commune_id: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    per_page: 12
  };
  
  propertyTypes: any[] = [];
  departments: any[] = [];
  communes: any[] = [];
  
  currentPage = 1;
  totalPages = 1;
  total = 0;

  ngOnInit(): void {
    this.loadPropertyTypes();
    this.loadDepartments();
    this.loadProperties();
  }

  loadPropertyTypes(): void {
    this.propertyService.getPropertyTypes().subscribe({
      next: (response) => {
        if (response.success) {
          // Handle different response structures
          if (Array.isArray(response.data)) {
            this.propertyTypes = response.data;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            this.propertyTypes = response.data.data;
          } else {
            this.propertyTypes = [];
          }
        } else {
          this.propertyTypes = [];
        }
      },
      error: () => {
        this.propertyTypes = [];
      }
    });
  }

  loadDepartments(): void {
    this.locationService.getDepartments().subscribe({
      next: (response) => {
        if (response.success) {
          // Handle different response structures
          if (Array.isArray(response.data)) {
            this.departments = response.data;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            this.departments = response.data.data;
          } else {
            this.departments = [];
          }
        } else {
          this.departments = [];
        }
      },
      error: () => {
        this.departments = [];
      }
    });
  }

  onDepartmentChange(): void {
    this.filters.commune_id = '';
    this.communes = [];
    if (this.filters.department_id) {
      this.locationService.getCommunes(parseInt(this.filters.department_id)).subscribe({
        next: (response) => {
          if (response.success) {
            // Handle different response structures
            if (Array.isArray(response.data)) {
              this.communes = response.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
              this.communes = response.data.data;
            } else {
              this.communes = [];
            }
          } else {
            this.communes = [];
          }
        },
        error: () => {
          this.communes = [];
        }
      });
    }
  }

  loadProperties(): void {
    this.loading = true;
    const params: any = {
      ...this.filters,
      is_verified: true,
      is_active: true,
      page: this.currentPage,
      per_page: this.filters.per_page || 12
    };
    
    // Remove empty filters
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    this.propertyService.getProperties(params).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.data?.data) {
            this.properties = response.data.data;
            this.currentPage = response.data.current_page || 1;
            this.totalPages = response.data.last_page || 1;
            this.total = response.data.total || 0;
          } else if (Array.isArray(response.data)) {
            this.properties = response.data;
            this.total = response.data.length;
            this.totalPages = 1;
          } else {
            this.properties = [];
            this.total = 0;
            this.totalPages = 1;
          }
        } else {
          this.properties = [];
          this.total = 0;
          this.totalPages = 1;
        }
        this.loading = false;
      },
      error: () => {
        this.properties = [];
        this.total = 0;
        this.totalPages = 1;
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadProperties();
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      property_type_id: '',
      min_price: '',
      max_price: '',
      min_surface: '',
      max_surface: '',
      bedrooms: '',
      bathrooms: '',
      department_id: '',
      commune_id: '',
      sort_by: 'created_at',
      sort_order: 'desc',
      per_page: 12
    };
    this.communes = [];
    this.currentPage = 1;
    this.loadProperties();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProperties();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadProperties();
    }
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
}

