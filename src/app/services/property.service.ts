import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Property, PropertyRequest, PropertyType, PropertyFeature } from '../models/property.model';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getProperties(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get(`${this.apiUrl}/properties`, { params: httpParams });
  }

  getProperty(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/properties/${id}`);
  }

  createProperty(data: PropertyRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/properties`, data);
  }

  updateProperty(id: number, data: Partial<PropertyRequest>): Observable<any> {
    return this.http.put(`${this.apiUrl}/properties/${id}`, data);
  }

  deleteProperty(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/properties/${id}`);
  }

  getMyProperties(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get(`${this.apiUrl}/properties/my-properties`, { params: httpParams });
  }

  verifyProperty(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/properties/${id}/verify`, {});
  }

  rejectProperty(id: number, reason: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/properties/${id}/reject`, { rejection_reason: reason });
  }

  getPropertyTypes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/property-types`);
  }

  getPropertyFeatures(): Observable<any> {
    return this.http.get(`${this.apiUrl}/property-features`);
  }
}

