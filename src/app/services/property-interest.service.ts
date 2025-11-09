import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PropertyInterestService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getInterests(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get(`${this.apiUrl}/property-interests`, { params: httpParams });
  }

  getInterest(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/property-interests/${id}`);
  }

  createInterest(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/property-interests`, data);
  }

  updateInterest(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/property-interests/${id}`, data);
  }

  deleteInterest(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/property-interests/${id}`);
  }

  getStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/property-interests/statistics`);
  }
}

