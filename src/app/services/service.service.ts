import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getServices(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get(`${this.apiUrl}/services`, { params: httpParams });
  }

  getService(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/services/${id}`);
  }

  createService(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/services`, data);
  }

  updateService(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/services/${id}`, data);
  }

  deleteService(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/services/${id}`);
  }

  toggleServiceStatus(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/services/${id}/toggle-status`, {});
  }
}

