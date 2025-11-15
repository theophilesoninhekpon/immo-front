import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property.service';
import { PropertyInterestService } from '../../../services/property-interest.service';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-buyer-property-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DecimalPipe],
  templateUrl: './buyer-property-detail.component.html',
  styleUrl: './buyer-property-detail.component.sass'
})
export class BuyerPropertyDetailComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private interestService = inject(PropertyInterestService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  property: any = null;
  loading = true;
  error: string | null = null;
  hasExistingInterest = false;
  checkingInterest = false;
  
  // Interest form
  showInterestForm = false;
  interestForm = {
    message: '',
    contact_phone: ''
  };
  submittingInterest = false;

  ngOnInit(): void {
    const propertyId = this.route.snapshot.paramMap.get('id');
    if (propertyId) {
      this.loadProperty(parseInt(propertyId));
    }
  }

  loadProperty(id: number): void {
    this.loading = true;
    this.error = null;
    
    this.propertyService.getProperty(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.property = response.data;
          this.checkExistingInterest(id);
        } else {
          this.error = 'Propriété non trouvée';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement de la propriété';
        this.loading = false;
      }
    });
  }

  checkExistingInterest(propertyId: number): void {
    this.checkingInterest = true;
    this.interestService.getInterests({ property_id: propertyId }).subscribe({
      next: (response: any) => {
        if (response.success) {
          const interests = response.data?.data || response.data || [];
          this.hasExistingInterest = interests.length > 0;
        }
        this.checkingInterest = false;
      },
      error: () => {
        this.checkingInterest = false;
      }
    });
  }

  showInterestFormModal(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.interestForm.contact_phone = currentUser.phone || '';
    }
    this.showInterestForm = true;
  }

  submitInterest(): void {
    if (!this.property?.id) return;
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      alert('Vous devez être connecté pour faire une demande');
      return;
    }

    if (!this.interestForm.message.trim()) {
      alert('Veuillez saisir un message');
      return;
    }

    this.submittingInterest = true;
    const data = {
      property_id: this.property.id,
      message: this.interestForm.message,
      contact_phone: this.interestForm.contact_phone || undefined
    };

    this.interestService.createInterest(data).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Votre demande d\'intérêt a été envoyée avec succès');
          this.showInterestForm = false;
          this.interestForm = { message: '', contact_phone: '' };
          this.hasExistingInterest = true; // Mettre à jour le flag
          this.router.navigate(['/buyer/requests']);
        }
        this.submittingInterest = false;
      },
      error: (err) => {
        alert(err.error?.message || 'Erreur lors de l\'envoi de la demande');
        this.submittingInterest = false;
      }
    });
  }

  getPropertyImageUrl(image: any): string {
    // Use the url attribute from backend (Supabase Storage URL)
    if (image?.url) {
      return image.url;
    }
    // Fallback to file_path if url is not available
    if (image?.file_path) {
      const baseUrl = environment.apiUrl.replace('/api', '');
      return `${baseUrl}/storage/${image.file_path}`;
    }
    return '';
  }

  getMainImage(): any | null {
    if (!this.property?.images || this.property.images.length === 0) {
      return null;
    }
    // Chercher l'image principale (is_main === true)
    const mainImage = this.property.images.find((img: any) => img.is_main === true);
    return mainImage || null;
  }

  getOtherImages(): any[] {
    if (!this.property?.images || this.property.images.length === 0) {
      return [];
    }
    // Retourner toutes les images sauf l'image principale
    const mainImage = this.getMainImage();
    if (mainImage) {
      return this.property.images.filter((img: any) => img.id !== mainImage.id);
    }
    // Si pas d'image principale, retourner toutes les images sauf la première
    return this.property.images.slice(1);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }

  goBack(): void {
    this.router.navigate(['/buyer/properties']);
  }
}

