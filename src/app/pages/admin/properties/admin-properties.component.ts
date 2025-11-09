import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../services/property.service';

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
  menuPosition: { top: number; right: number; bottom?: number } | null = null;
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
    if (this.openMenuId === propertyId) {
      this.openMenuId = null;
      this.menuPosition = null;
    } else {
      this.openMenuId = propertyId;
      if (event) {
        const button = event.currentTarget as HTMLElement;
        const rect = button.getBoundingClientRect();
        const menuHeight = 280; // Hauteur approximative du menu
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const scrollY = window.scrollY || window.pageYOffset;
        
        // Aligner le menu avec le bouton mais légèrement décalé pour voir le bouton
        // Commencer au niveau du haut du bouton
        let menuTop = rect.top + scrollY;
        
        // Si le menu dépasserait en bas, ajuster vers le haut
        if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
          menuTop = rect.top + scrollY - (menuHeight - spaceBelow) - 10;
          menuTop = Math.max(10, menuTop); // Ne pas dépasser le haut de l'écran
        } else {
          // Sinon, décaler légèrement vers le bas pour voir le bouton (environ 8px)
          menuTop = rect.top + scrollY + 8;
        }
        
        this.menuPosition = {
          top: menuTop,
          right: window.innerWidth - rect.right
        };
      }
    }
  }

  closeMenu(): void {
    this.openMenuId = null;
    this.menuPosition = null;
  }

  getMaxMenuHeight(): number {
    if (!this.menuPosition) return 300;
    const scrollY = window.scrollY || window.pageYOffset;
    const menuTop = this.menuPosition.top - scrollY;
    
    // Calculer la hauteur maximale disponible
    const spaceBelow = window.innerHeight - menuTop - 10; // 10px de marge en bas
    const spaceAbove = menuTop - 10; // 10px de marge en haut
    
    // Utiliser l'espace disponible (en bas ou en haut selon la position)
    const maxHeight = Math.max(spaceBelow, spaceAbove);
    return Math.min(Math.max(maxHeight, 200), 400); // Minimum 200px, maximum 400px
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

}
