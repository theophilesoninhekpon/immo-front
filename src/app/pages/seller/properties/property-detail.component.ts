import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property.service';
import { AuthService } from '../../../services/auth.service';
import { MediaService } from '../../../services/media.service';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './property-detail.component.html'
})
export class PropertyDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private propertyService = inject(PropertyService);
  private authService = inject(AuthService);
  private mediaService = inject(MediaService);

  property: any = null;
  loading = true;
  error = '';
  currentUser: any = null;
  isOwner = false;
  isAdmin = false;
  
  // Media management
  images: any[] = [];
  documents: any[] = [];
  uploadingImages = false;
  uploadingDocuments = false;
  selectedImages: File[] = [];
  selectedImagePreviews: { file: File; preview: string; isMain: boolean; alt_text?: string; caption?: string }[] = [];
  
  // Image principale
  mainImageFile: File | null = null;
  mainImagePreview: string | null = null;
  mainImageAltText: string = '';
  mainImageCaption: string = '';
  uploadingMainImage = false;
  
  // Documents avec formulaire
  documentTypes: any[] = [];
  documentForms: { file: File | null; document_type_id: number | null; name: string; description: string }[] = [];
  showDocumentForm = false;

  private propertyLoaded = false;

  ngOnInit(): void {
    this.loadDocumentTypes();
    
    // Charger la propriété une seule fois au démarrage
    const propertyId = this.route.snapshot.paramMap.get('id');
    if (propertyId && !this.propertyLoaded) {
      this.propertyLoaded = true;
      this.loadProperty(+propertyId);
    }
    
    // Mettre à jour les informations utilisateur sans recharger la propriété
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.roles?.some((r: any) => r.name === 'admin') || false;
      
      // Mettre à jour isOwner si la propriété est déjà chargée
      if (this.property && user) {
        this.isOwner = this.property.owner_id === user.id;
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
          // Filtrer pour ne garder que les types pour les propriétés
          this.documentTypes = this.documentTypes.filter((type: any) => type.entity_type === 'property');
        } else {
          this.documentTypes = [];
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des types de documents', err);
        this.documentTypes = [];
      }
    });
  }

  loadProperty(id: number): void {
    // Ne pas charger si on n'est pas authentifié
    if (!this.authService.isAuthenticated()) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.propertyService.getProperty(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.property = response.data;
          this.isOwner = this.property.owner_id === this.currentUser?.id;
          this.loadMedia(id);
        } else {
          this.error = response.message || 'Erreur lors du chargement du bien';
        }
        this.loading = false;
      },
      error: (err) => {
        // Ne pas afficher d'erreur si c'est une erreur 401 (déjà gérée par l'intercepteur)
        if (err.status !== 401) {
          this.error = err.error?.message || 'Erreur lors du chargement du bien';
        }
        this.loading = false;
      }
    });
  }

  loadMedia(propertyId: number): void {
    // Ne pas charger si on n'est pas authentifié
    if (!this.authService.isAuthenticated()) {
      return;
    }
    
    // Load images
    this.mediaService.getImages(propertyId).subscribe({
      next: (response) => {
        if (response.success) {
          this.images = response.data || [];
        }
      },
      error: (err) => {
        // Ignorer les erreurs 401 (déjà gérées par l'intercepteur)
        if (err.status !== 401) {
          console.error('Erreur lors du chargement des images', err);
        }
      }
    });

    // Load documents
    this.mediaService.getDocuments(propertyId).subscribe({
      next: (response) => {
        if (response.success) {
          this.documents = response.data || [];
        }
      },
      error: (err) => {
        // Ignorer les erreurs 401 (déjà gérées par l'intercepteur)
        if (err.status !== 401) {
          console.error('Erreur lors du chargement des documents', err);
        }
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'available': 'Disponible',
      'sold': 'Vendu',
      'pending_verification': 'En attente',
      'rejected': 'Rejeté',
      'draft': 'Brouillon'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'available': 'bg-green-100 text-green-800',
      'sold': 'bg-blue-100 text-blue-800',
      'pending_verification': 'bg-yellow-100 text-yellow-800',
      'rejected': 'bg-red-100 text-red-800',
      'draft': 'bg-slate-100 text-slate-800'
    };
    return classes[status] || 'bg-slate-100 text-slate-800';
  }

  deleteProperty(): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce bien ? Cette action est irréversible.')) {
      return;
    }

    this.propertyService.deleteProperty(this.property.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/seller']);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la suppression';
      }
    });
  }

  getImageUrl(image: any): string {
    if (image?.file_path) {
      return `http://localhost:8000/storage/${image.file_path}`;
    }
    return '';
  }

  getMainImage(): any | null {
    return this.images.find(img => img.is_main) || null;
  }

  getOtherImages(): any[] {
    return this.images.filter(img => !img.is_main);
  }

  // Vérifier si tous les médias sont validés
  allMediaVerified(): boolean {
    const allImagesVerified = this.images.length > 0 && this.images.every(img => img.is_verified);
    const allDocumentsVerified = this.documents.length > 0 && this.documents.every(doc => doc.status === 'verified');
    const hasPendingImages = this.images.some(img => !img.is_verified);
    const hasPendingDocuments = this.documents.some(doc => doc.status === 'pending' || doc.status === 'rejected');
    
    // Si aucun média, on ne peut pas valider
    if (this.images.length === 0 && this.documents.length === 0) {
      return false;
    }
    
    // Si des médias existent, ils doivent tous être validés
    return !hasPendingImages && !hasPendingDocuments;
  }

  getMediaStatus(): { allVerified: boolean; pendingImages: number; pendingDocuments: number; rejectedImages: number; rejectedDocuments: number } {
    const pendingImages = this.images.filter(img => !img.is_verified).length;
    const pendingDocuments = this.documents.filter(doc => doc.status === 'pending').length;
    const rejectedImages = this.images.filter(img => img.status === 'rejected').length;
    const rejectedDocuments = this.documents.filter(doc => doc.status === 'rejected').length;
    
    return {
      allVerified: this.allMediaVerified(),
      pendingImages,
      pendingDocuments,
      rejectedImages,
      rejectedDocuments
    };
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }

  goBack(): void {
    const currentPath = this.router.url;
    if (currentPath.startsWith('/admin')) {
      this.router.navigate(['/admin/properties']);
    } else {
      this.router.navigate(['/seller']);
    }
  }

  getEditPath(): string[] {
    const currentPath = this.router.url;
    if (currentPath.startsWith('/admin')) {
      return ['/admin/properties', this.property.id, 'edit'];
    } else {
      return ['/seller/properties', this.property.id, 'edit'];
    }
  }

  // Image management
  onMainImageSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    
    this.mainImageFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.mainImagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  uploadMainImage(): void {
    if (!this.mainImageFile || !this.property) return;

    this.uploadingMainImage = true;
    const metadata = [{
      is_main: true,
      sort_order: 0,
      alt_text: this.mainImageAltText || undefined,
      caption: this.mainImageCaption || undefined
    }];

    this.mediaService.uploadImages(this.property.id, [this.mainImageFile], metadata).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadMedia(this.property.id);
          this.mainImageFile = null;
          this.mainImagePreview = null;
          this.mainImageAltText = '';
          this.mainImageCaption = '';
          const fileInput = document.getElementById('main-image-input') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }
        this.uploadingMainImage = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de l\'upload de l\'image principale';
        this.uploadingMainImage = false;
      }
    });
  }

  clearMainImage(): void {
    this.mainImageFile = null;
    this.mainImagePreview = null;
    this.mainImageAltText = '';
    this.mainImageCaption = '';
    const fileInput = document.getElementById('main-image-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  onImagesSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.selectedImages = files;
    this.selectedImagePreviews = [];
    
    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImagePreviews.push({
          file: file,
          preview: e.target.result,
          isMain: false, // Les autres images ne sont pas principales par défaut
          alt_text: '',
          caption: ''
        });
      };
      reader.readAsDataURL(file);
    });
  }

  toggleMainImage(index: number): void {
    // Désactiver toutes les autres
    this.selectedImagePreviews.forEach((preview, i) => {
      preview.isMain = i === index;
    });
  }

  removeSelectedImage(index: number): void {
    this.selectedImagePreviews.splice(index, 1);
    this.selectedImages.splice(index, 1);
  }

  clearImageSelection(): void {
    this.selectedImages = [];
    this.selectedImagePreviews = [];
    const fileInput = document.getElementById('image-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  uploadImages(): void {
    if (this.selectedImages.length === 0 || !this.property) return;

    this.uploadingImages = true;
    
    // Trouver l'index de l'image principale (si marquée dans le lot)
    const mainIndex = this.selectedImagePreviews.findIndex(preview => preview.isMain);
    
    // Vérifier s'il existe déjà une image principale pour ce bien
    const hasExistingMainImage = this.images.some(img => img.is_main);
    
    // Préparer les métadonnées
    // L'image principale ne peut être définie QUE via le bouton "Image principale"
    // Donc même si une image est marquée dans le lot, elle ne devient pas principale si une existe déjà
    // Et si aucune n'est marquée, aucune ne devient principale
    const metadata = this.selectedImagePreviews.map((preview, index) => ({
      is_main: false, // Jamais principale lors de l'upload via "Autres images" - doit être définie via le bouton dédié
      sort_order: this.images.length + index + 1, // Continuer la numérotation après les images existantes
      alt_text: preview.alt_text || undefined,
      caption: preview.caption || undefined
    }));

    this.mediaService.uploadImages(this.property.id, this.selectedImages, metadata).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadMedia(this.property.id);
          this.selectedImages = [];
          this.selectedImagePreviews = [];
          // Reset file input
          const fileInput = document.getElementById('image-input') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }
        this.uploadingImages = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de l\'upload des images';
        this.uploadingImages = false;
      }
    });
  }

  deleteImage(imageId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) return;

    this.mediaService.deleteImage(this.property.id, imageId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadMedia(this.property.id);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la suppression';
      }
    });
  }

  setMainImage(imageId: number): void {
    this.mediaService.setMainImage(this.property.id, imageId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadMedia(this.property.id);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la définition de l\'image principale';
      }
    });
  }

  // Document management
  addDocumentForm(): void {
    this.documentForms.push({
      file: null,
      document_type_id: null,
      name: '',
      description: ''
    });
  }

  removeDocumentForm(index: number): void {
    this.documentForms.splice(index, 1);
  }

  onDocumentFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.documentForms[index].file = file;
      if (!this.documentForms[index].name) {
        // Suggérer le nom du fichier sans extension
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        this.documentForms[index].name = nameWithoutExt;
      }
    }
  }

  uploadDocuments(): void {
    if (!this.property) return;

    // Vérifier que tous les formulaires ont un fichier et un type
    const validForms = this.documentForms.filter(form => 
      form.file && form.document_type_id && form.name.trim()
    );

    if (validForms.length === 0) {
      alert('Veuillez remplir au moins un document avec un fichier, un type et un nom');
      return;
    }

    this.uploadingDocuments = true;
    
    const files = validForms.map(form => form.file!);
    const metadata = validForms.map(form => ({
      document_type_id: form.document_type_id!,
      name: form.name.trim(),
      description: form.description.trim() || undefined
    }));

    this.mediaService.uploadDocuments(this.property.id, files, metadata).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadMedia(this.property.id);
          this.documentForms = [];
          this.showDocumentForm = false;
        }
        this.uploadingDocuments = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de l\'upload des documents';
        this.uploadingDocuments = false;
      }
    });
  }

  cancelDocumentUpload(): void {
    this.documentForms = [];
    this.showDocumentForm = false;
  }

  deleteDocument(documentId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    this.mediaService.deleteDocument(this.property.id, documentId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadMedia(this.property.id);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la suppression';
      }
    });
  }

  getDocumentUrl(document: any): string {
    if (document?.file_path) {
      return `http://localhost:8000/storage/${document.file_path}`;
    }
    return '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Admin document verification
  verifyingDocumentId: number | null = null;
  rejectingDocumentId: number | null = null;
  rejectionReason = '';
  
  // Admin property verification
  verifyingProperty = false;

  // Admin image verification
  verifyingImageId: number | null = null;
  rejectingImageId: number | null = null;
  imageRejectionReason = '';

  // Image preview modal
  previewImage: any | null = null;

  // Action menu
  openActionMenu = false;
  menuPosition: { top: number; right: number } | null = null;

  verifyDocument(documentId: number): void {
    this.verifyingDocumentId = documentId;
    this.mediaService.verifyDocument(this.property.id, documentId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadMedia(this.property.id);
        }
        this.verifyingDocumentId = null;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la vérification';
        this.verifyingDocumentId = null;
      }
    });
  }

  rejectDocumentPrompt(documentId: number): void {
    this.rejectingDocumentId = documentId;
    this.rejectionReason = '';
  }

  cancelReject(): void {
    this.rejectingDocumentId = null;
    this.rejectionReason = '';
  }

  confirmRejectDocument(documentId: number): void {
    if (!this.rejectionReason.trim()) {
      alert('Veuillez fournir une raison de rejet');
      return;
    }

    this.mediaService.rejectDocument(this.property.id, documentId, this.rejectionReason).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadMedia(this.property.id);
        }
        this.rejectingDocumentId = null;
        this.rejectionReason = '';
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du rejet';
        this.rejectingDocumentId = null;
      }
    });
  }

  // Image verification
  verifyImage(imageId: number): void {
    this.verifyingImageId = imageId;
    this.mediaService.verifyImage(this.property.id, imageId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadMedia(this.property.id);
        }
        this.verifyingImageId = null;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la vérification';
        this.verifyingImageId = null;
      }
    });
  }

  rejectImagePrompt(imageId: number): void {
    this.rejectingImageId = imageId;
    this.imageRejectionReason = '';
  }

  cancelRejectImage(): void {
    this.rejectingImageId = null;
    this.imageRejectionReason = '';
  }

  confirmRejectImage(imageId: number): void {
    if (!this.imageRejectionReason.trim()) {
      alert('Veuillez fournir une raison de rejet');
      return;
    }

    this.mediaService.rejectImage(this.property.id, imageId, this.imageRejectionReason).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadMedia(this.property.id);
        }
        this.rejectingImageId = null;
        this.imageRejectionReason = '';
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du rejet';
        this.rejectingImageId = null;
      }
    });
  }

  // Image preview
  previewImageModal(image: any): void {
    this.previewImage = image;
  }

  closePreviewModal(): void {
    this.previewImage = null;
  }

  // Action menu
  toggleActionMenu(event?: MouseEvent): void {
    if (this.openActionMenu) {
      this.openActionMenu = false;
      this.menuPosition = null;
    } else {
      this.openActionMenu = true;
      if (event) {
        const button = event.currentTarget as HTMLElement;
        const rect = button.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        
        this.menuPosition = {
          top: rect.bottom + scrollY + 4,
          right: window.innerWidth - rect.right
        };
      }
    }
  }

  closeActionMenu(): void {
    this.openActionMenu = false;
    this.menuPosition = null;
  }

  handleAction(action: string): void {
    this.closeActionMenu();
    
    switch (action) {
      case 'edit':
        this.router.navigate(this.getEditPath());
        break;
      case 'delete':
        this.deleteProperty();
        break;
    }
  }

  // Admin property verification
  verifyProperty(): void {
    if (!this.property) return;
    
    // Vérifier que tous les médias sont validés
    if (!this.allMediaVerified()) {
      alert('Veuillez valider tous les médias (images et documents) avant de valider le bien.');
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir valider ce bien ? Cette action marquera le bien comme vérifié et publié.')) {
      this.verifyingProperty = true;
      this.propertyService.verifyProperty(this.property.id).subscribe({
        next: (response) => {
          if (response.success) {
            // Recharger le bien pour mettre à jour le statut
            this.loadProperty(this.property.id);
            alert('Bien validé avec succès !');
          }
          this.verifyingProperty = false;
        },
        error: (error) => {
          console.error('Error verifying property:', error);
          alert('Erreur lors de la validation: ' + (error.error?.message || 'Erreur inconnue'));
          this.verifyingProperty = false;
        }
      });
    }
  }

  rejectProperty(): void {
    if (!this.property) return;
    
    const reason = prompt('Raison du rejet :');
    if (reason && reason.trim()) {
      this.propertyService.rejectProperty(this.property.id, reason.trim()).subscribe({
        next: (response) => {
          if (response.success) {
            // Recharger le bien pour mettre à jour le statut
            this.loadProperty(this.property.id);
            alert('Bien rejeté avec succès.');
          }
        },
        error: (error) => {
          console.error('Error rejecting property:', error);
          alert('Erreur lors du rejet: ' + (error.error?.message || 'Erreur inconnue'));
        }
      });
    }
  }
}
