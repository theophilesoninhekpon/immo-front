import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../services/property.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-properties',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule, RouterLink],
  templateUrl: './admin-properties.component.html',
  styleUrl: './admin-properties.component.sass'
})
export class AdminPropertiesComponent implements OnInit, OnDestroy {
  private propertyService = inject(PropertyService);
  private router = inject(Router);

  properties: any[] = [];
  loading = true;
  deletingId: number | null = null;
  viewMode: 'table' | 'grid' = 'table';
  openMenuId: number | null = null;
  menuPosition: { top: number; left: number } | null = null;
  filters = {
    status: '',
    is_verified: '',
    search: '',
    property_type_id: '',
    min_price: '',
    max_price: ''
  };

  ngOnInit(): void {
    this.loadProperties();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.menu-container')) {
      this.closeMenu();
    }
  }

  ngOnDestroy(): void {
    this.closeMenu();
  }

  loadProperties(): void {
    this.loading = true;
    const params: any = {};
    
    if (this.filters.status) {
      params.status = this.filters.status;
    }
    if (this.filters.is_verified !== '') {
      params.is_verified = this.filters.is_verified === 'true';
    }
    if (this.filters.search) {
      params.search = this.filters.search;
    }
    if (this.filters.property_type_id) {
      params.property_type_id = this.filters.property_type_id;
    }
    if (this.filters.min_price) {
      params.min_price = this.filters.min_price;
    }
    if (this.filters.max_price) {
      params.max_price = this.filters.max_price;
    }

    this.propertyService.getProperties(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.properties = response.data?.data || response.data || [];
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  verifyProperty(id: number): void {
    // Vérifier que tous les médias sont validés avant de permettre la validation du bien
    // Cette vérification sera faite côté backend, mais on peut aussi l'afficher ici
    if (confirm('Êtes-vous sûr de vouloir vérifier ce bien ? Assurez-vous que tous les médias (images et documents) sont validés.')) {
      this.propertyService.verifyProperty(id).subscribe({
        next: () => {
          this.loadProperties();
        },
        error: (error) => {
          alert('Erreur lors de la vérification: ' + (error.error?.message || 'Erreur inconnue'));
        }
      });
    }
  }

  rejectProperty(id: number): void {
    const reason = prompt('Raison du rejet :');
    if (reason) {
      this.propertyService.rejectProperty(id, reason).subscribe({
        next: () => {
          this.loadProperties();
        },
        error: (error) => {
          alert('Erreur lors du rejet: ' + (error.error?.message || 'Erreur inconnue'));
        }
      });
    }
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'available': 'bg-green-100 text-green-800',
      'pending_verification': 'bg-yellow-100 text-yellow-800',
      'sold': 'bg-blue-100 text-blue-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'available': 'Disponible',
      'pending_verification': 'En attente',
      'sold': 'Vendu',
      'rejected': 'Rejeté'
    };
    return labels[status] || status;
  }

  getVerificationStatusClass(isVerified: boolean): string {
    return isVerified 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  }

  editProperty(id: number): void {
    this.router.navigate(['/admin/properties', id, 'edit']);
  }

  viewProperty(id: number): void {
    this.router.navigate(['/admin/properties', id]);
  }

  deleteProperty(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce bien ? Cette action est irréversible.')) {
      this.deletingId = id;
      this.propertyService.deleteProperty(id).subscribe({
        next: () => {
          this.loadProperties();
          this.deletingId = null;
        },
        error: (error) => {
          alert('Erreur lors de la suppression: ' + (error.error?.message || 'Erreur inconnue'));
          this.deletingId = null;
        }
      });
    }
  }

  resetFilters(): void {
    this.filters = {
      status: '',
      is_verified: '',
      search: '',
      property_type_id: '',
      min_price: '',
      max_price: ''
    };
    this.loadProperties();
  }

  toggleMenu(propertyId: number, event?: MouseEvent): void {
    // Empêcher la propagation du clic pour éviter que le HostListener ne ferme le menu
    if (event) {
      event.stopPropagation();
    }
    
    if (this.openMenuId === propertyId) {
      this.openMenuId = null;
      this.menuPosition = null;
      return;
    }
    
    // Fermer le menu précédent s'il existe
    this.openMenuId = propertyId;
    this.menuPosition = null;
    
    // Utiliser setTimeout pour s'assurer que le DOM est prêt
    setTimeout(() => {
      if (event && this.openMenuId === propertyId) {
        const button = event.currentTarget as HTMLElement;
        const rect = button.getBoundingClientRect();
        
        // Dimensions du menu
        const menuWidth = 224; // w-56 = 14rem = 224px
        const menuHeight = 300; // Hauteur approximative maximale
        const padding = 10; // Marge de sécurité
        
        // Calculer la position horizontale (left)
        let menuLeft = rect.right - menuWidth;
        
        // Si le menu dépasse à gauche, l'aligner à droite du bouton
        if (menuLeft < padding) {
          menuLeft = rect.left;
        }
        
        // Si le menu dépasse toujours à droite, l'aligner à gauche du bouton
        if (menuLeft + menuWidth > window.innerWidth - padding) {
          menuLeft = rect.left - menuWidth;
        }
        
        // S'assurer que le menu ne dépasse pas à gauche
        if (menuLeft < padding) {
          menuLeft = padding;
        }
        
        // Calculer la position verticale (top)
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const scrollY = window.scrollY || window.pageYOffset;
        
        let menuTop: number;
        
        // Si on a assez d'espace en bas, placer le menu en bas du bouton
        if (spaceBelow >= menuHeight + padding) {
          menuTop = rect.bottom + scrollY + 5;
        }
        // Si on a plus d'espace en haut qu'en bas, placer le menu au-dessus
        else if (spaceAbove > spaceBelow) {
          menuTop = rect.top + scrollY - menuHeight - 5;
          // S'assurer que le menu ne dépasse pas en haut
          if (menuTop < scrollY + padding) {
            menuTop = scrollY + padding;
          }
        }
        // Sinon, placer le menu en bas mais ajuster la hauteur max
        else {
          menuTop = rect.bottom + scrollY + 5;
        }
        
        // S'assurer que le menu ne dépasse pas en bas
        const maxTop = scrollY + window.innerHeight - menuHeight - padding;
        if (menuTop > maxTop) {
          menuTop = Math.max(scrollY + padding, maxTop);
        }
        
        this.menuPosition = {
          top: menuTop,
          left: menuLeft
        };
      }
    }, 0);
  }

  closeMenu(): void {
    this.openMenuId = null;
    this.menuPosition = null;
  }

  getMaxMenuHeight(): number {
    if (!this.menuPosition) return 300;
    const scrollY = window.scrollY || window.pageYOffset;
    const menuTop = this.menuPosition.top - scrollY;
    const padding = 10;
    
    // Calculer la hauteur maximale disponible en bas
    const spaceBelow = window.innerHeight - menuTop - padding;
    
    // Calculer la hauteur maximale disponible en haut (si le menu est au-dessus)
    const spaceAbove = menuTop - padding;
    
    // Utiliser l'espace disponible, avec un minimum de 200px
    const maxHeight = Math.max(Math.max(spaceBelow, spaceAbove), 200);
    
    // Limiter à 400px maximum
    return Math.min(maxHeight, 400);
  }

  handleAction(action: string, propertyId: number): void {
    this.closeMenu();
    switch(action) {
      case 'view':
        this.viewProperty(propertyId);
        break;
      case 'edit':
        this.editProperty(propertyId);
        break;
      case 'verify':
        this.verifyProperty(propertyId);
        break;
      case 'reject':
        this.rejectProperty(propertyId);
        break;
      case 'delete':
        this.deleteProperty(propertyId);
        break;
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
