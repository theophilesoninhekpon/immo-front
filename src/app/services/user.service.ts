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
    return this.http.patch(`${this.apiUrl}/users/${id}/verify`, {});
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

  // Documents utilisateurs
  uploadUserDocuments(userId: number, documents: File[], metadata?: any[]): Observable<any> {
    const formData = new FormData();
    
    documents.forEach((document, index) => {
      formData.append(`documents[${index}]`, document);
      if (metadata && metadata[index]) {
        if (metadata[index].document_type_id) {
          formData.append(`documents[${index}][document_type_id]`, metadata[index].document_type_id.toString());
        }
        if (metadata[index].name) {
          formData.append(`documents[${index}][name]`, metadata[index].name);
        }
        if (metadata[index].description) {
          formData.append(`documents[${index}][description]`, metadata[index].description);
        }
      }
    });

    return this.http.post(`${this.apiUrl}/users/${userId}/documents`, formData);
  }

  getUserDocuments(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${userId}/documents`);
  }

  deleteUserDocument(userId: number, documentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}/documents/${documentId}`);
  }

  verifyUserDocument(userId: number, documentId: number, notes?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/${userId}/documents/${documentId}/verify`, { notes });
  }

  rejectUserDocument(userId: number, documentId: number, reason: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/${userId}/documents/${documentId}/reject`, { rejection_reason: reason });
  }
}

