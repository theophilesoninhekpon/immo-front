import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PropertyTypeService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getPropertyTypes(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get(`${this.apiUrl}/property-types`, { params: httpParams });
  }

  getPropertyType(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/property-types/${id}`);
  }

  createPropertyType(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/property-types`, data);
  }

  updatePropertyType(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/property-types/${id}`, data);
  }

  deletePropertyType(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/property-types/${id}`);
  }
}

