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

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      first_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]],
      role: ['acheteur', [Validators.required]]
    }, { validators: passwordMatchValidator });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.error = '';
      
      this.authService.register(this.registerForm.value).subscribe({
        next: (response) => {
          if (response.success) {
            const user = response.data.user;
            
            // Rediriger selon le rôle
            if (user.roles?.some(r => r.name === 'admin')) {
              this.router.navigate(['/admin']);
            } else if (user.roles?.some(r => r.name === 'vendeur')) {
              this.router.navigate(['/seller']);
            } else {
              this.router.navigate(['/buyer']);
            }
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
}

