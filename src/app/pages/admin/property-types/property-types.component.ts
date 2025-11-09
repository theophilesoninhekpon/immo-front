import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PropertyTypeService } from '../../../services/property-type.service';

@Component({
  selector: 'app-property-types',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './property-types.component.html'
})
export class PropertyTypesComponent implements OnInit {
  private propertyTypeService = inject(PropertyTypeService);

  propertyTypes: any[] = [];
  loading = false;
  showForm = false;
  editingType: any = null;
  formData = {
    name: '',
    code: '',
    description: '',
    icon: '',
    sort_order: 0,
    is_active: true
  };
  filters = {
    is_active: '',
    search: ''
  };

  ngOnInit(): void {
    this.loadPropertyTypes();
  }

  loadPropertyTypes(): void {
    this.loading = true;
    this.propertyTypeService.getPropertyTypes(this.filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.propertyTypes = response.data?.data || response.data || [];
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openForm(type?: any): void {
    if (type) {
      this.editingType = type;
      this.formData = {
        name: type.name || '',
        code: type.code || '',
        description: type.description || '',
        icon: type.icon || '',
        sort_order: type.sort_order || 0,
        is_active: type.is_active !== undefined ? type.is_active : true
      };
    } else {
      this.editingType = null;
      this.formData = {
        name: '',
        code: '',
        description: '',
        icon: '',
        sort_order: 0,
        is_active: true
      };
    }
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingType = null;
  }

  saveType(): void {
    if (!this.formData.name.trim()) {
      alert('Le nom est requis');
      return;
    }

    this.loading = true;
    const request = this.editingType
      ? this.propertyTypeService.updatePropertyType(this.editingType.id, this.formData)
      : this.propertyTypeService.createPropertyType(this.formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.loadPropertyTypes();
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

  deleteType(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce type de bien ?')) {
      this.loading = true;
      this.propertyTypeService.deletePropertyType(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadPropertyTypes();
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

  applyFilters(): void {
    this.loadPropertyTypes();
  }
}

