import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const passwordConfirmation = control.get('password_confirmation');
  
  if (!password || !passwordConfirmation) {
    return null;
  }
  
  return password.value === passwordConfirmation.value ? null : { passwordMismatch: true };
}

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  
  const value = control.value;
  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumeric = /[0-9]/.test(value);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumeric) {
    return { passwordStrength: true };
  }
  
  return null;
}

function phoneValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  
  // 10 chiffres commençant par 01
  const phoneRegex = /^01[0-9]{8}$/;
  return phoneRegex.test(control.value) ? null : { phoneFormat: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.sass'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  error: string = '';
  loading = false;
  showPassword = false;
  showPasswordConfirmation = false;

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, phoneValidator]],
      password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
      password_confirmation: ['', [Validators.required]],
      role: ['vendeur', [Validators.required]]
    }, { validators: passwordMatchValidator });
  }

  getPasswordStrength(): { strength: string; color: string; percentage: number } {
    const password = this.registerForm.get('password')?.value || '';
    if (!password) {
      return { strength: '', color: '', percentage: 0 };
    }
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    if (strength <= 25) {
      return { strength: 'Faible', color: 'bg-red-500', percentage: strength };
    } else if (strength <= 50) {
      return { strength: 'Moyen', color: 'bg-yellow-500', percentage: strength };
    } else if (strength <= 75) {
      return { strength: 'Bon', color: 'bg-blue-500', percentage: strength };
    } else {
      return { strength: 'Fort', color: 'bg-green-500', percentage: strength };
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  togglePasswordConfirmationVisibility(): void {
    this.showPasswordConfirmation = !this.showPasswordConfirmation;
  }

  hasLowerCase(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return /(?=.*[a-z])/.test(password);
  }

  hasUpperCase(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return /(?=.*[A-Z])/.test(password);
  }

  hasNumeric(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return /(?=.*\d)/.test(password);
  }

  hasMinLength(): boolean {
    const password = this.registerForm.get('password')?.value || '';
    return password.length >= 8;
  }

  getFormErrors(): any {
    const errors: any = {};
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    if (this.registerForm.errors) {
      errors['form'] = this.registerForm.errors;
    }
    return errors;
  }

  isFormValid(): boolean {
    // Vérifier que tous les champs requis sont remplis
    const name = this.registerForm.get('name')?.value?.trim();
    const first_name = this.registerForm.get('first_name')?.value?.trim();
    const email = this.registerForm.get('email')?.value?.trim();
    const phone = this.registerForm.get('phone')?.value?.trim().replace(/\s+/g, '');
    const password = this.registerForm.get('password')?.value;
    const password_confirmation = this.registerForm.get('password_confirmation')?.value;
    const role = this.registerForm.get('role')?.value;

    if (!name || name.length < 2 || !first_name || first_name.length < 2 || !email || !phone || !password || !password_confirmation || !role) {
      return false;
    }

    // Vérifier le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Vérifier le format du téléphone (10 chiffres commençant par 01)
    if (!/^01[0-9]{8}$/.test(phone)) {
      return false;
    }

    // Vérifier la force du mot de passe
    if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return false;
    }

    // Vérifier que les mots de passe correspondent
    if (password !== password_confirmation) {
      return false;
    }

    return true;
  }

  onSubmit(): void {
    // Marquer tous les champs comme touchés pour afficher les erreurs
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = '';
    
    this.authService.register(this.registerForm.value).subscribe({
        next: (response) => {
          if (response.success) {
            // Afficher le message de succès
            // Rediriger vers la page de connexion pour qu'il se connecte
            this.router.navigate(['/login'], {
              queryParams: { registered: 'true' }
            });
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors de l\'inscription';
          if (err.error?.errors) {
            const errors = Object.values(err.error.errors).flat();
            this.error = errors.join(', ');
          }
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
  }
}

