import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-public-property-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  templateUrl: './public-property-detail.component.html',
  styleUrl: './public-property-detail.component.sass'
})
export class PublicPropertyDetailComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  property: any = null;
  loading = true;
  error: string | null = null;

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
}

