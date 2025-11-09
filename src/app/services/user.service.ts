import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getUsers(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get(`${this.apiUrl}/users`, { params: httpParams });
  }

  getUser(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`);
  }

  createUser(data: Partial<User>): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, data);
  }

  updateUser(id: number, data: Partial<User>): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, data);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  verifyUser(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${id}/verify`, {});
  }

  rejectUser(id: number, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${id}/reject`, { rejection_reason: reason });
  }

  toggleUserStatus(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${id}/toggle-status`, {});
  }

  getPendingSellers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/pending-sellers`);
  }

  getUserStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/statistics`);
  }

  getUserProperties(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${userId}/properties`);
  }
}

