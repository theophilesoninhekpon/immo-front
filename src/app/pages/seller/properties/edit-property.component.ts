import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PropertyService } from '../../../services/property.service';
import { LocationService } from '../../../services/location.service';

@Component({
  selector: 'app-edit-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-property.component.html'
})
export class EditPropertyComponent implements OnInit {
  private fb = inject(FormBuilder);
  private propertyService = inject(PropertyService);
  private locationService = inject(LocationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  propertyForm!: FormGroup;
  currentStep = 1;
  totalSteps = 4;
  loading = false;
  error = '';
  success = false;
  propertyId: number | null = null;
  property: any = null;

  // Data
  propertyTypes: any[] = [];
  departments: any[] = [];
  communes: any[] = [];
  arrondissements: any[] = [];
  towns: any[] = [];
  features: any[] = [];

  constructor() {
    this.initForm();
  }

  numberValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || control.value === '') {
      return null;
    }
    const num = parseFloat(control.value);
    if (isNaN(num) || num < 0) {
      return { invalidNumber: true };
    }
    return null;
  }

  initForm(): void {
    this.propertyForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', [Validators.required, Validators.maxLength(5000)]],
      reference: ['', [Validators.required, Validators.maxLength(50)]],
      property_type_id: ['', Validators.required],
      price: ['', [Validators.required, this.numberValidator]],
      surface_area: ['', [Validators.required, this.numberValidator]],
      rooms: [''],
      bedrooms: [''],
      bathrooms: [''],
      floors: [''],
      year_built: [''],
      is_furnished: [false],
      has_parking: [false],
      has_garden: [false],
      has_pool: [false],
      has_balcony: [false],
      has_elevator: [false],
      selectedFeatures: [[]],
      address: this.fb.group({
        department_id: ['', Validators.required],
        commune_id: ['', Validators.required],
        arrondissement_id: [''],
        town_id: [''],
        street: [''],
        postal_code: [''],
        latitude: [''],
        longitude: ['']
      })
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.propertyId = +id;
      this.loadData();
      this.loadProperty();
    }
  }

  loadProperty(): void {
    if (!this.propertyId) return;
    
    this.loading = true;
    this.propertyService.getProperty(this.propertyId).subscribe({
      next: (response) => {
        if (response.success) {
          this.property = response.data;
          this.populateForm();
        } else {
          this.error = response.message || 'Erreur lors du chargement du bien';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement du bien';
        this.loading = false;
      }
    });
  }

  populateForm(): void {
    if (!this.property) return;

    // Load dependent location data first
    if (this.property.address?.department_id) {
      this.loadCommunes(this.property.address.department_id);
    }
    if (this.property.address?.commune_id) {
      this.loadArrondissements(this.property.address.commune_id);
      this.loadTowns(this.property.address.commune_id, this.property.address.arrondissement_id);
    }

    // Populate form
    this.propertyForm.patchValue({
      title: this.property.title || '',
      description: this.property.description || '',
      reference: this.property.reference || '',
      property_type_id: this.property.property_type_id || '',
      price: this.property.price || '',
      surface_area: this.property.surface_area || '',
      rooms: this.property.rooms || '',
      bedrooms: this.property.bedrooms || '',
      bathrooms: this.property.bathrooms || '',
      floors: this.property.floors || '',
      year_built: this.property.year_built || '',
      is_furnished: this.property.is_furnished ?? false,
      has_parking: this.property.has_parking ?? false,
      has_garden: this.property.has_garden ?? false,
      has_pool: this.property.has_pool ?? false,
      has_balcony: this.property.has_balcony ?? false,
      has_elevator: this.property.has_elevator ?? false,
      selectedFeatures: this.property.features?.map((f: any) => f.id) || [],
      address: {
        department_id: this.property.address?.department_id || '',
        commune_id: this.property.address?.commune_id || '',
        arrondissement_id: this.property.address?.arrondissement_id || '',
        town_id: this.property.address?.town_id || '',
        street: this.property.address?.street || '',
        postal_code: this.property.address?.postal_code || '',
        latitude: this.property.address?.latitude || '',
        longitude: this.property.address?.longitude || ''
      }
    });
  }

  loadData(): void {
    this.propertyService.getPropertyTypes().subscribe({
      next: (response) => {
        if (response.success) {
          this.propertyTypes = response.data || [];
        }
      }
    });

    this.locationService.getDepartments().subscribe({
      next: (response) => {
        if (response.success) {
          this.departments = response.data || [];
        } else if (Array.isArray(response)) {
          this.departments = response;
        } else if (response.data && Array.isArray(response.data)) {
          this.departments = response.data;
        }
      }
    });

    this.propertyService.getPropertyFeatures().subscribe({
      next: (response) => {
        if (response.success) {
          this.features = response.data || [];
        }
      }
    });

    // Watch department changes
    setTimeout(() => {
      const addressGroup = this.propertyForm.get('address');
      if (addressGroup) {
        addressGroup.get('department_id')?.valueChanges.subscribe(departmentId => {
          if (departmentId) {
            this.loadCommunes(departmentId);
            addressGroup.patchValue({
              commune_id: '',
              arrondissement_id: '',
              town_id: ''
            });
            this.communes = [];
            this.arrondissements = [];
            this.towns = [];
          }
        });

        addressGroup.get('commune_id')?.valueChanges.subscribe(communeId => {
          if (communeId) {
            this.loadArrondissements(communeId);
            this.loadTowns(communeId);
            addressGroup.patchValue({
              arrondissement_id: '',
              town_id: ''
            });
            this.arrondissements = [];
            this.towns = [];
          }
        });

        addressGroup.get('arrondissement_id')?.valueChanges.subscribe(arrondissementId => {
          if (arrondissementId) {
            const communeId = addressGroup.get('commune_id')?.value;
            this.loadTowns(communeId, arrondissementId);
            addressGroup.patchValue({
              town_id: ''
            });
            this.towns = [];
          }
        });
      }
    }, 0);
  }

  loadCommunes(departmentId: number): void {
    this.locationService.getCommunes(departmentId).subscribe({
      next: (response) => {
        if (response.success) {
          this.communes = response.data || [];
        } else if (Array.isArray(response)) {
          this.communes = response;
        } else if (response.data && Array.isArray(response.data)) {
          this.communes = response.data;
        }
      }
    });
  }

  loadArrondissements(communeId: number): void {
    this.locationService.getArrondissements(communeId).subscribe({
      next: (response) => {
        if (response.success) {
          this.arrondissements = response.data || [];
        } else if (Array.isArray(response)) {
          this.arrondissements = response;
        } else if (response.data && Array.isArray(response.data)) {
          this.arrondissements = response.data;
        }
      }
    });
  }

  loadTowns(communeId: number, arrondissementId?: number): void {
    this.locationService.getTowns(communeId, arrondissementId).subscribe({
      next: (response) => {
        if (response.success) {
          this.towns = response.data || [];
        } else if (Array.isArray(response)) {
          this.towns = response;
        } else if (response.data && Array.isArray(response.data)) {
          this.towns = response.data;
        }
      }
    });
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps && this.isStepValid()) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!(this.propertyForm.get('title')?.valid && 
               this.propertyForm.get('description')?.valid &&
               this.propertyForm.get('reference')?.valid &&
               this.propertyForm.get('property_type_id')?.valid);
      case 2:
        return !!(this.propertyForm.get('price')?.valid && 
               this.propertyForm.get('surface_area')?.valid);
      case 3:
        return true;
      case 4:
        return !!(this.propertyForm.get('address.department_id')?.valid && 
               this.propertyForm.get('address.commune_id')?.valid);
      default:
        return false;
    }
  }

  getStepProgress(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  toggleFeature(featureId: number): void {
    const selectedFeatures = this.propertyForm.get('selectedFeatures')?.value || [];
    const index = selectedFeatures.indexOf(featureId);
    
    if (index > -1) {
      selectedFeatures.splice(index, 1);
    } else {
      selectedFeatures.push(featureId);
    }
    
    this.propertyForm.patchValue({ selectedFeatures });
  }

  isFeatureSelected(featureId: number): boolean {
    return (this.propertyForm.get('selectedFeatures')?.value || []).includes(featureId);
  }

  onSubmit(): void {
    this.markFormGroupTouched(this.propertyForm);
    
    if (this.isFormValid() && this.propertyId) {
      this.loading = true;
      this.error = '';

      const formValue = this.propertyForm.value;
      const propertyData: any = {
        title: formValue.title,
        description: formValue.description,
        reference: formValue.reference,
        property_type_id: parseInt(formValue.property_type_id),
        price: parseFloat(formValue.price),
        surface_area: parseFloat(formValue.surface_area),
        rooms: formValue.rooms ? parseInt(formValue.rooms) : undefined,
        bedrooms: formValue.bedrooms ? parseInt(formValue.bedrooms) : undefined,
        bathrooms: formValue.bathrooms ? parseInt(formValue.bathrooms) : undefined,
        floors: formValue.floors ? parseInt(formValue.floors) : undefined,
        year_built: formValue.year_built ? parseInt(formValue.year_built) : undefined,
        is_furnished: formValue.is_furnished ?? false,
        has_parking: formValue.has_parking ?? false,
        has_garden: formValue.has_garden ?? false,
        has_pool: formValue.has_pool ?? false,
        has_balcony: formValue.has_balcony ?? false,
        has_elevator: formValue.has_elevator ?? false,
        features: formValue.selectedFeatures || [],
        address: {
          department_id: formValue.address.department_id,
          commune_id: formValue.address.commune_id,
          arrondissement_id: formValue.address.arrondissement_id || undefined,
          town_id: formValue.address.town_id || undefined,
          street: formValue.address.street || '',
          postal_code: formValue.address.postal_code || '',
          latitude: formValue.address.latitude || undefined,
          longitude: formValue.address.longitude || undefined
        }
      };

      this.propertyService.updateProperty(this.propertyId, propertyData).subscribe({
        next: (response) => {
          if (response.success) {
            this.success = true;
            const currentPath = this.router.url;
            const redirectPath = currentPath.startsWith('/admin') 
              ? ['/admin/properties', this.propertyId]
              : ['/seller/properties', this.propertyId];
            
            setTimeout(() => {
              this.router.navigate(redirectPath);
            }, 2000);
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors de la modification du bien';
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  round(value: number): number {
    return Math.round(value);
  }

  isFormValid(): boolean {
    const titleValid = this.propertyForm.get('title')?.valid;
    const descriptionValid = this.propertyForm.get('description')?.valid;
    const referenceValid = this.propertyForm.get('reference')?.valid;
    const propertyTypeValid = this.propertyForm.get('property_type_id')?.valid;
    const priceValid = this.propertyForm.get('price')?.valid;
    const surfaceValid = this.propertyForm.get('surface_area')?.valid;
    const departmentValid = this.propertyForm.get('address.department_id')?.valid;
    const communeValid = this.propertyForm.get('address.commune_id')?.valid;

    return !!(titleValid && descriptionValid && referenceValid && propertyTypeValid && 
              priceValid && surfaceValid && departmentValid && communeValid);
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
