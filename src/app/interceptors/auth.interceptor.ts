import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Ne pas intercepter les requêtes d'authentification
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  const token = authService.getToken();

  // Si pas de token, continuer sans authentification
  if (!token) {
    return next(req);
  }

  // Vérifier si le token expire bientôt et le rafraîchir si nécessaire
  const shouldRefresh = authService.isTokenExpiringSoon(5);
  
  // Si le token doit être rafraîchi, le faire avant d'envoyer la requête
  if (shouldRefresh) {
    return authService.refreshTokenIfNeeded().pipe(
      mergeMap((refreshed) => {
        // Récupérer le token (peut être nouveau si rafraîchi)
        const currentToken = authService.getToken();
        
        // Ajouter le token à la requête
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${currentToken}`
          }
        });

        return next(authReq);
      }),
      catchError((error) => {
        // Si le refresh échoue, déconnecter et retourner l'erreur
        authService.logout();
        return throwError(() => error);
      })
    );
  }

  // Ajouter le token à la requête
  req = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  // Gérer les erreurs 401 (token expiré)
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) {
        // Token expiré, essayer de le rafraîchir
        return authService.refreshToken().pipe(
          switchMap((response: any) => {
            if (response.success && response.data?.token) {
              // Réessayer la requête avec le nouveau token
              const newReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.data.token}`
                }
              });
              return next(newReq);
            } else {
              // Échec du refresh, déconnecter
              authService.logout();
              return throwError(() => error);
            }
          }),
          catchError((refreshError) => {
            // Échec du refresh, déconnecter
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

