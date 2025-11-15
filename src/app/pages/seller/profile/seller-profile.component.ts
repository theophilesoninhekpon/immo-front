import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { MediaService } from '../../../services/media.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seller-profile.component.html'
})
export class SellerProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private mediaService = inject(MediaService);
  private route = inject(ActivatedRoute);

  currentUser: any = null;
  documents: any[] = [];
  documentTypes: any[] = []; // Initialisé comme tableau vide
  loading = false;
  uploading = false;
  redirectMessage: string | null = null;
  
  // Formulaire de document
  showDocumentForm = false;
  documentForms: { file: File | null; document_type_id: number | null; name: string; description: string }[] = [];
  
  // Vérification
  verificationStatus: any = null;

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Vérifier s'il y a un message de redirection
    this.route.queryParams.subscribe((params: any) => {
      if (params['message']) {
        this.redirectMessage = params['message'];
      }
    });
    
    if (this.currentUser) {
      this.loadDocuments();
      this.loadDocumentTypes();
      this.loadVerificationStatus();
    }
  }

  loadDocuments(): void {
    if (!this.currentUser?.id) return;
    
    this.loading = true;
    this.userService.getUserDocuments(this.currentUser.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.documents = response.data || [];
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadDocumentTypes(): void {
    this.mediaService.getDocumentTypes().subscribe({
      next: (response) => {
        if (response.success) {
          // S'assurer que documentTypes est toujours un tableau
          if (Array.isArray(response.data)) {
            this.documentTypes = response.data;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            this.documentTypes = response.data.data;
          } else {
            this.documentTypes = [];
          }
          // Filtrer pour ne garder que les types pour les utilisateurs
          this.documentTypes = this.documentTypes.filter((type: any) => type.entity_type === 'user');
        } else {
          this.documentTypes = [];
        }
      },
      error: () => {
        this.documentTypes = [];
      }
    });
  }

  loadVerificationStatus(): void {
    if (!this.currentUser?.id) return;
    
    this.userService.getUser(this.currentUser.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.verificationStatus = response.data;
        }
      }
    });
  }

  addDocumentForm(): void {
    this.documentForms.push({
      file: null,
      document_type_id: null,
      name: '',
      description: ''
    });
    this.showDocumentForm = true;
  }

  removeDocumentForm(index: number): void {
    this.documentForms.splice(index, 1);
    if (this.documentForms.length === 0) {
      this.showDocumentForm = false;
    }
  }

  onDocumentFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.documentForms[index].file = file;
      if (!this.documentForms[index].name) {
        this.documentForms[index].name = file.name;
      }
    }
  }

  uploadDocuments(): void {
    if (!this.currentUser?.id) return;

    const validForms = this.documentForms.filter(form => form.file && form.document_type_id);
    
    if (validForms.length === 0) {
      alert('Veuillez sélectionner au moins un fichier et renseigner son type');
      return;
    }

    this.uploading = true;
    const files = validForms.map(form => form.file!);
    const metadata = validForms.map(form => ({
      document_type_id: form.document_type_id!,
      name: form.name || form.file!.name,
      description: form.description || undefined
    }));

    this.userService.uploadUserDocuments(this.currentUser.id, files, metadata).subscribe({
      next: (response) => {
        if (response.success) {
          this.documentForms = [];
          this.showDocumentForm = false;
          this.loadDocuments();
          this.loadVerificationStatus();
          alert('Documents uploadés avec succès');
        }
        this.uploading = false;
      },
      error: (err) => {
        alert(err.error?.message || 'Erreur lors de l\'upload des documents');
        this.uploading = false;
      }
    });
  }

  deleteDocument(documentId: number): void {
    if (!this.currentUser?.id) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    this.userService.deleteUserDocument(this.currentUser.id, documentId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadDocuments();
          this.loadVerificationStatus();
        }
      }
    });
  }

  getDocumentUrl(document: any): string {
    // Use the url attribute from backend (Supabase Storage URL)
    if (document?.url) {
      return document.url;
    }
    // Fallback to file_path if url is not available
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}/storage/${document.file_path}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'En attente',
      'verified': 'Vérifié',
      'rejected': 'Rejeté',
      'missing': 'Manquant'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'verified': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'missing': 'bg-slate-100 text-slate-800'
    };
    return classes[status] || 'bg-slate-100 text-slate-800';
  }

  getVerificationStatusLabel(): string {
    if (!this.verificationStatus) return 'Non vérifié';
    const status = this.verificationStatus.verification_status;
    const labels: { [key: string]: string } = {
      'pending': 'En attente de vérification',
      'verified': 'Vérifié',
      'rejected': 'Rejeté'
    };
    return labels[status] || 'Non vérifié';
  }

  getVerificationStatusClass(): string {
    if (!this.verificationStatus) return 'bg-slate-100 text-slate-800';
    const status = this.verificationStatus.verification_status;
    const classes: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'verified': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-slate-100 text-slate-800';
  }

  canCreateProperties(): boolean {
    return this.verificationStatus?.verification_status === 'verified';
  }
}

