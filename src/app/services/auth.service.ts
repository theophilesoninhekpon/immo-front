import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, of, catchError, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap(response => {
        if (response.success && response.data) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.some(r => r.name === role) ?? false;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isSeller(): boolean {
    return this.hasRole('vendeur');
  }

  isBuyer(): boolean {
    return this.hasRole('acheteur');
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh`, {}).pipe(
      tap(response => {
        if (response.success && response.data) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }

  updateProfile(data: Partial<User>): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/profile`, data).pipe(
      tap((response: any) => {
        if (response.success && response.data) {
          localStorage.setItem('user', JSON.stringify(response.data));
          this.currentUserSubject.next(response.data);
        }
      })
    );
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/me`).pipe(
      tap((response: any) => {
        if (response.success && response.data) {
          localStorage.setItem('user', JSON.stringify(response.data));
          this.currentUserSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Décode le token JWT et retourne son payload
   */
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  /**
   * Vérifie si le token est expiré ou va expirer bientôt
   * @param minutesBeforeExpiry Nombre de minutes avant expiration pour considérer le token comme "à rafraîchir"
   */
  isTokenExpiringSoon(minutesBeforeExpiry: number = 5): boolean {
    const token = this.getToken();
    if (!token) {
      return true;
    }

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    const minutesUntilExpiry = timeUntilExpiry / (1000 * 60);

    return minutesUntilExpiry <= minutesBeforeExpiry;
  }

  /**
   * Vérifie si le token est complètement expiré
   */
  isTokenExpired(): boolean {
    return this.isTokenExpiringSoon(0);
  }

  /**
   * Rafraîchit le token si nécessaire (proactif)
   * Retourne un Observable qui émet true si le token a été rafraîchi, false sinon
   */
  refreshTokenIfNeeded(): Observable<boolean> {
    if (!this.isAuthenticated()) {
      return of(false);
    }

    // Si le token expire dans moins de 5 minutes, le rafraîchir
    if (this.isTokenExpiringSoon(5)) {
      return this.refreshToken().pipe(
        tap(() => {
          console.log('Token rafraîchi automatiquement');
        }),
        switchMap(() => of(true)),
        catchError((error) => {
          console.error('Erreur lors du rafraîchissement du token:', error);
          // Si le refresh échoue, déconnecter l'utilisateur
          this.logout();
          return of(false);
        })
      );
    }

    return of(false);
  }
}

