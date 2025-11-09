import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DocumentTypeService } from '../../../services/document-type.service';

@Component({
  selector: 'app-document-types',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './document-types.component.html'
})
export class DocumentTypesComponent implements OnInit {
  private documentTypeService = inject(DocumentTypeService);

  documentTypes: any[] = [];
  loading = false;
  showForm = false;
  editingType: any = null;
  formData = {
    name: '',
    code: '',
    entity_type: 'user',
    is_required: false,
    description: '',
    max_file_size: null as number | null,
    allowed_mime_types: [] as string[],
    sort_order: 0,
    is_active: true
  };
  filters = {
    entity_type: '',
    is_active: '',
    search: ''
  };

  ngOnInit(): void {
    this.loadDocumentTypes();
  }

  loadDocumentTypes(): void {
    this.loading = true;
    this.documentTypeService.getDocumentTypes(this.filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.documentTypes = response.data?.data || response.data || [];
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
        entity_type: type.entity_type || 'user',
        is_required: type.is_required || false,
        description: type.description || '',
        max_file_size: type.max_file_size || null,
        allowed_mime_types: type.allowed_mime_types || [],
        sort_order: type.sort_order || 0,
        is_active: type.is_active !== undefined ? type.is_active : true
      };
    } else {
      this.editingType = null;
      this.formData = {
        name: '',
        code: '',
        entity_type: 'user',
        is_required: false,
        description: '',
        max_file_size: null,
        allowed_mime_types: [],
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

  save(): void {
    if (!this.formData.name || !this.formData.code) {
      alert('Le nom et le code sont requis');
      return;
    }

    if (this.editingType) {
      this.documentTypeService.updateDocumentType(this.editingType.id, this.formData).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadDocumentTypes();
            this.closeForm();
          }
        }
      });
    } else {
      this.documentTypeService.createDocumentType(this.formData).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadDocumentTypes();
            this.closeForm();
          }
        }
      });
    }
  }

  delete(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce type de document ?')) {
      return;
    }

    this.documentTypeService.deleteDocumentType(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadDocumentTypes();
        } else {
          alert(response.message || 'Erreur lors de la suppression');
        }
      }
    });
  }

  applyFilters(): void {
    this.loadDocumentTypes();
  }

  resetFilters(): void {
    this.filters = {
      entity_type: '',
      is_active: '',
      search: ''
    };
    this.loadDocumentTypes();
  }
}

