import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyService } from '../../../services/property.service';
import { LocationService } from '../../../services/location.service';
import { AuthService } from '../../../services/auth.service';

// Leaflet types (OpenStreetMap - FREE alternative)
declare var L: any;

@Component({
  selector: 'app-create-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-property.component.html',
  styleUrl: './create-property.component.sass'
})
export class CreatePropertyComponent implements OnInit {
  private fb = inject(FormBuilder);
  private propertyService = inject(PropertyService);
  private locationService = inject(LocationService);
  private router = inject(Router);

  propertyForm!: FormGroup;
  currentStep = 1;
  totalSteps = 4;
  loading = false;
  error = '';
  success = false;

  // Data
  propertyTypes: any[] = [];
  departments: any[] = [];
  communes: any[] = [];
  arrondissements: any[] = [];
  towns: any[] = [];
  features: any[] = [];

  // Map
  map: any = null;
  marker: any = null;
  mapInitialized = false;

  constructor(private authService: AuthService) {
    this.initForm();
  }

  numberValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || control.value === '') {
      return null; // Let required validator handle empty
    }
    const num = parseFloat(control.value);
    if (isNaN(num) || num < 0) {
      return { invalidNumber: true };
    }
    return null;
  }

  initForm(): void {
    this.propertyForm = this.fb.group({
      // Step 1: Informations de base
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', [Validators.required, Validators.maxLength(5000)]],
      reference: ['', [Validators.required, Validators.maxLength(50)]],
      property_type_id: ['', Validators.required],
      
      // Step 2: Prix et caractéristiques
      price: ['', [Validators.required, this.numberValidator]],
      surface_area: ['', [Validators.required, this.numberValidator]],
      rooms: [''],
      bedrooms: [''],
      bathrooms: [''],
      floors: [''],
      year_built: [''],
      
      // Step 3: Équipements
      is_furnished: [false],
      has_parking: [false],
      has_garden: [false],
      has_pool: [false],
      has_balcony: [false],
      has_elevator: [false],
      selectedFeatures: [[]],
      
      // Step 4: Adresse
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
    this.loadData();
  }

  // Helper method to extract array data from response
  private extractArrayData(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }
    if (response?.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  }

  // Initialize Leaflet Map (OpenStreetMap - FREE, no API key needed)
  // TODO: Migrer vers Google Maps plus tard pour plus de fonctionnalités
  initMap(): void {
    if (typeof L === 'undefined') {
      console.error('Leaflet library not loaded');
      return;
    }

    const addressGroup = this.propertyForm.get('address');
    const lat = addressGroup?.get('latitude')?.value || 6.4969; // Default: Cotonou
    const lng = addressGroup?.get('longitude')?.value || 2.6036;

    const mapElement = document.getElementById('property-map');
    if (!mapElement) {
      console.error('Map element not found');
      return;
    }

    // Initialize map centered on Bénin (Cotonou)
    this.map = L.map(mapElement).setView([parseFloat(lat) || 6.4969, parseFloat(lng) || 2.6036], 13);

    // Add OpenStreetMap tiles (FREE, no API key needed)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Add marker if coordinates exist
    if (lat && lng) {
      this.addMarker(parseFloat(lat), parseFloat(lng));
    }

    // Add click listener to place marker
    this.map.on('click', (e: any) => {
      const clickedLat = e.latlng.lat;
      const clickedLng = e.latlng.lng;
      this.addMarker(clickedLat, clickedLng);
      this.updateCoordinates(clickedLat, clickedLng);
    });

    this.mapInitialized = true;
  }

  addMarker(lat: number, lng: number): void {
    if (!this.map) return;

    // Remove existing marker
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    // Create custom icon (red marker)
    const customIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Add new marker
    this.marker = L.marker([lat, lng], {
      draggable: true,
      icon: customIcon
    }).addTo(this.map);

    // Add popup
    this.marker.bindPopup('Localisation du bien').openPopup();

    // Update coordinates when marker is dragged
    this.marker.on('dragend', (e: any) => {
      const newLat = e.target.getLatLng().lat;
      const newLng = e.target.getLatLng().lng;
      this.updateCoordinates(newLat, newLng);
    });

    // Center map on marker
    this.map.setView([lat, lng], this.map.getZoom());
  }

  updateCoordinates(lat: number, lng: number): void {
    const addressGroup = this.propertyForm.get('address');
    if (addressGroup) {
      addressGroup.patchValue({
        latitude: lat.toString(),
        longitude: lng.toString()
      });
    }
  }

  // Use current location with high accuracy
  useCurrentLocation(event?: Event): void {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }

    // Show loading state
    const button = event?.target as HTMLElement;
    const originalText = button?.textContent;
    if (button) {
      button.textContent = 'Localisation en cours...';
      button.setAttribute('disabled', 'true');
    }

    // Request high accuracy position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy; // Accuracy in meters

        // Add marker
        this.addMarker(lat, lng);
        this.updateCoordinates(lat, lng);

        // Show accuracy info to user
        let accuracyMessage = '';
        if (accuracy < 10) {
          accuracyMessage = 'Précision excellente (GPS)';
        } else if (accuracy < 50) {
          accuracyMessage = 'Précision bonne';
        } else if (accuracy < 100) {
          accuracyMessage = 'Précision acceptable';
        } else {
          accuracyMessage = 'Précision approximative - Vérifiez sur la carte';
        }

        // Restore button
        if (button && originalText) {
          button.textContent = originalText;
          button.removeAttribute('disabled');
        }

        // Show success message with accuracy
        alert(`Position récupérée avec succès !\n${accuracyMessage}\nPrécision : ±${Math.round(accuracy)} mètres\n\nVous pouvez ajuster le marqueur sur la carte si nécessaire.`);
      },
      (error) => {
        console.error('Error getting location:', error);
        
        // Restore button
        if (button && originalText) {
          button.textContent = originalText;
          button.removeAttribute('disabled');
        }

        // Better error messages
        let errorMessage = 'Impossible d\'obtenir votre localisation.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permission de géolocalisation refusée. Veuillez autoriser l\'accès à votre position dans les paramètres du navigateur.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position indisponible. Vérifiez que votre GPS/Wi-Fi est activé.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Délai d\'attente dépassé. Veuillez réessayer ou sélectionner manuellement sur la carte.';
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true, // Use GPS if available for better accuracy
        timeout: 10000, // 10 seconds timeout
        maximumAge: 0 // Don't use cached position
      }
    );
  }

  loadData(): void {
    // Load property types
    this.propertyService.getPropertyTypes().subscribe({
      next: (response) => {
        this.propertyTypes = this.extractArrayData(response);
      },
      error: (error) => {
        console.error('Error loading property types:', error);
        this.propertyTypes = [];
      }
    });

    // Load departments
    this.locationService.getDepartments().subscribe({
      next: (response) => {
        this.departments = this.extractArrayData(response);
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.departments = [];
      }
    });

    // Load features
    this.propertyService.getPropertyFeatures().subscribe({
      next: (response) => {
        this.features = this.extractArrayData(response);
      },
      error: (error) => {
        console.error('Error loading features:', error);
        this.features = [];
      }
    });

    // Watch department changes
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

      // Watch commune changes
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

      // Watch arrondissement changes
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
  }

  loadCommunes(departmentId: number): void {
    this.locationService.getCommunes(departmentId).subscribe({
      next: (response) => {
        this.communes = this.extractArrayData(response);
      },
      error: (error) => {
        console.error('Error loading communes:', error);
        this.communes = [];
      }
    });
  }

  loadArrondissements(communeId: number): void {
    this.locationService.getArrondissements(communeId).subscribe({
      next: (response) => {
        this.arrondissements = this.extractArrayData(response);
      },
      error: (error) => {
        console.error('Error loading arrondissements:', error);
        this.arrondissements = [];
      }
    });
  }

  loadTowns(communeId?: number, arrondissementId?: number): void {
    this.locationService.getTowns(communeId, arrondissementId).subscribe({
      next: (response) => {
        this.towns = this.extractArrayData(response);
      },
      error: (error) => {
        console.error('Error loading towns:', error);
        this.towns = [];
      }
    });
  }

  nextStep(): void {
    if (this.isStepValid()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        // Initialize map when reaching step 4
        if (this.currentStep === 4 && !this.mapInitialized) {
          setTimeout(() => this.initMap(), 100);
        }
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      // Initialize map if going back to step 4
      if (this.currentStep === 4 && !this.mapInitialized) {
        setTimeout(() => this.initMap(), 100);
      }
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
        return true; // Équipements optionnels
      case 4:
        return !!(this.propertyForm.get('address.department_id')?.valid && 
               this.propertyForm.get('address.commune_id')?.valid);
      default:
        return false;
    }
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
    // Log form state for debugging
    console.log('Form valid:', this.propertyForm.valid);
    console.log('Form errors:', this.getFormErrors());
    console.log('Form value:', this.propertyForm.value);
    console.log('isFormValid():', this.isFormValid());
    
    // Mark all fields as touched to show errors
    this.markFormGroupTouched(this.propertyForm);
    
    if (this.isFormValid()) {
      this.loading = true;
      this.error = '';

      const formValue = this.propertyForm.value;
      const propertyData = {
        title: formValue.title,
        description: formValue.description,
        reference: formValue.reference,
        property_type_id: formValue.property_type_id,
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

      // Convert to backend format
      const backendData: any = {
        title: propertyData.title,
        description: propertyData.description,
        reference: propertyData.reference,
        property_type_id: propertyData.property_type_id,
        price: propertyData.price,
        surface_area: propertyData.surface_area,
        rooms: propertyData.rooms,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        floors: propertyData.floors,
        year_built: propertyData.year_built,
        is_furnished: propertyData.is_furnished,
        has_parking: propertyData.has_parking,
        has_garden: propertyData.has_garden,
        has_pool: propertyData.has_pool,
        has_balcony: propertyData.has_balcony,
        has_elevator: propertyData.has_elevator,
        features: propertyData.features,
        address: {
          department_id: propertyData.address.department_id,
          commune_id: propertyData.address.commune_id,
          arrondissement_id: propertyData.address.arrondissement_id,
          town_id: propertyData.address.town_id,
          street: propertyData.address.street,
          postal_code: propertyData.address.postal_code,
          latitude: propertyData.address.latitude,
          longitude: propertyData.address.longitude
        }
      };

      this.propertyService.createProperty(backendData).subscribe({
        next: (response) => {
          if (response.success) {
            this.success = true;
            // Determine redirect path based on current route
            const currentPath = this.router.url;
            const redirectPath = currentPath.startsWith('/admin') 
              ? ['/admin/properties', response.data.id]
              : ['/seller/properties', response.data.id];
            
            setTimeout(() => {
              this.router.navigate(redirectPath);
            }, 2000);
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors de la création du bien';
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      // Mark all fields as touched to show errors
      Object.keys(this.propertyForm.controls).forEach(key => {
        const control = this.propertyForm.get(key);
        if (control instanceof FormGroup) {
          Object.keys(control.controls).forEach(subKey => {
            control.get(subKey)?.markAsTouched();
          });
        } else {
          control?.markAsTouched();
        }
      });
    }
  }

  getStepProgress(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  round(value: number): number {
    return Math.round(value);
  }

  getFormErrors(): any {
    const errors: any = {};
    Object.keys(this.propertyForm.controls).forEach(key => {
      const control = this.propertyForm.get(key);
      if (control && control.invalid) {
        errors[key] = control.errors;
        if (control instanceof FormGroup) {
          Object.keys(control.controls).forEach(subKey => {
            const subControl = control.get(subKey);
            if (subControl && subControl.invalid) {
              errors[`${key}.${subKey}`] = subControl.errors;
            }
          });
        }
      }
    });
    return errors;
  }

  isFormValid(): boolean {
    // Check all required fields
    const titleValid = this.propertyForm.get('title')?.valid;
    const descriptionValid = this.propertyForm.get('description')?.valid;
    const referenceValid = this.propertyForm.get('reference')?.valid;
    const propertyTypeValid = this.propertyForm.get('property_type_id')?.valid;
    const priceValid = this.propertyForm.get('price')?.valid;
    const surfaceValid = this.propertyForm.get('surface_area')?.valid;
    const departmentValid = this.propertyForm.get('address.department_id')?.valid;
    const communeValid = this.propertyForm.get('address.commune_id')?.valid;

    console.log('Validation check:', {
      title: titleValid,
      description: descriptionValid,
      reference: referenceValid,
      propertyType: propertyTypeValid,
      price: priceValid,
      surface: surfaceValid,
      department: departmentValid,
      commune: communeValid
    });

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
