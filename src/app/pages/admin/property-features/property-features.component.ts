import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PropertyFeatureService } from '../../../services/property-feature.service';

@Component({
  selector: 'app-property-features',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './property-features.component.html'
})
export class PropertyFeaturesComponent implements OnInit {
  private propertyFeatureService = inject(PropertyFeatureService);

  propertyFeatures: any[] = [];
  loading = false;
  showForm = false;
  editingFeature: any = null;
  formData = {
    name: '',
    code: '',
    description: '',
    icon: '',
    type: 'boolean',
    unit: '',
    sort_order: 0,
    is_active: true
  };
  filters = {
    is_active: '',
    type: '',
    search: ''
  };

  ngOnInit(): void {
    this.loadPropertyFeatures();
  }

  loadPropertyFeatures(): void {
    this.loading = true;
    this.propertyFeatureService.getPropertyFeatures(this.filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.propertyFeatures = response.data?.data || response.data || [];
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openForm(feature?: any): void {
    if (feature) {
      this.editingFeature = feature;
      this.formData = {
        name: feature.name || '',
        code: feature.code || '',
        description: feature.description || '',
        icon: feature.icon || '',
        type: feature.type || 'boolean',
        unit: feature.unit || '',
        sort_order: feature.sort_order || 0,
        is_active: feature.is_active !== undefined ? feature.is_active : true
      };
    } else {
      this.editingFeature = null;
      this.formData = {
        name: '',
        code: '',
        description: '',
        icon: '',
        type: 'boolean',
        unit: '',
        sort_order: 0,
        is_active: true
      };
    }
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingFeature = null;
  }

  saveFeature(): void {
    if (!this.formData.name.trim()) {
      alert('Le nom est requis');
      return;
    }

    this.loading = true;
    const request = this.editingFeature
      ? this.propertyFeatureService.updatePropertyFeature(this.editingFeature.id, this.formData)
      : this.propertyFeatureService.createPropertyFeature(this.formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.loadPropertyFeatures();
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

  deleteFeature(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette caractéristique ?')) {
      this.loading = true;
      this.propertyFeatureService.deletePropertyFeature(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadPropertyFeatures();
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
    this.loadPropertyFeatures();
  }

  getTypeLabel(type: string): string {
    const labels: any = {
      'boolean': 'Booléen',
      'numeric': 'Numérique',
      'text': 'Texte'
    };
    return labels[type] || type;
  }
}

