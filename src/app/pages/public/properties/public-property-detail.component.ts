import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PropertyService } from '../../../services/property.service';
import { PropertyInterestService } from '../../../services/property-interest.service';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-public-property-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe, ReactiveFormsModule],
  templateUrl: './public-property-detail.component.html',
  styleUrl: './public-property-detail.component.sass'
})
export class PublicPropertyDetailComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private propertyInterestService = inject(PropertyInterestService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  property: any = null;
  loading = true;
  error: string | null = null;
  interestForm!: FormGroup;
  showInterestForm = false;
  submittingInterest = false;
  interestSuccess = false;
  isAuthenticated = false;

  ngOnInit(): void {
    // Vérifier l'état d'authentification
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
    });

    // Initialiser le formulaire d'intérêt
    this.interestForm = this.fb.group({
      contact_phone: ['', [Validators.required, Validators.pattern(/^01\d{8}$/)]],
      contact_email: ['', [Validators.email]],
      message: ['']
    });

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

  getPropertyImageUrl(image: any): string {
    // Use the url attribute from backend (Supabase Storage URL)
    if (image?.url) {
      return image.url;
    }
    // Fallback to file_path if url is not available (for backward compatibility)
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
    this.router.navigate(['/properties']);
  }

  showInterestFormDialog(): void {
    this.showInterestForm = true;
    this.interestSuccess = false;
  }

  closeInterestForm(): void {
    this.showInterestForm = false;
    this.interestForm.reset();
    this.interestSuccess = false;
  }

  submitInterest(): void {
    if (this.interestForm.invalid || !this.property) {
      Object.keys(this.interestForm.controls).forEach(key => {
        this.interestForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submittingInterest = true;
    const formData = {
      property_id: this.property.id,
      contact_phone: this.interestForm.get('contact_phone')?.value?.trim().replace(/\s+/g, ''),
      contact_email: this.interestForm.get('contact_email')?.value?.trim() || null,
      message: this.interestForm.get('message')?.value?.trim() || null
    };

    this.propertyInterestService.createInterest(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.interestSuccess = true;
          this.interestForm.reset();
          setTimeout(() => {
            this.closeInterestForm();
          }, 2000);
        }
        this.submittingInterest = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de l\'envoi de votre demande';
        this.submittingInterest = false;
      }
    });
  }
}

