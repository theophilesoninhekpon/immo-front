import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.sass'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  error: string = '';
  loading = false;
  showPassword = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = '';
      
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          if (response.success) {
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
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
          this.error = err.error?.message || 'Erreur lors de la connexion';
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }
}

