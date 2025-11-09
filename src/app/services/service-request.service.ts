import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServiceRequestService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getServiceRequests(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get(`${this.apiUrl}/service-requests`, { params: httpParams });
  }

  getServiceRequest(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/service-requests/${id}`);
  }

  createServiceRequest(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/service-requests`, data);
  }

  updateServiceRequest(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/service-requests/${id}`, data);
  }

  deleteServiceRequest(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/service-requests/${id}`);
  }

  updateStatus(id: number, status: string, notes?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/service-requests/${id}/status`, { status, notes });
  }

  quotePrice(id: number, quotedPrice: number, notes?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/service-requests/${id}/quote`, { quoted_price: quotedPrice, notes });
  }

  respondToQuote(id: number, action: 'accept' | 'reject', notes?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/service-requests/${id}/respond-quote`, { action, notes });
  }
}

