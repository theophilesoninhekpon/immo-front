import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRedirecting = false;

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Éviter les redirections multiples
        if (!isRedirecting) {
          isRedirecting = true;
          authService.logout();
          
          // Vérifier si on n'est pas déjà sur la page de login
          if (!router.url.includes('/login')) {
            router.navigate(['/login']).then(() => {
              // Réinitialiser le flag après un court délai
              setTimeout(() => {
                isRedirecting = false;
              }, 1000);
            });
          } else {
            isRedirecting = false;
          }
        }
      }
      return throwError(() => error);
    })
  );
};

