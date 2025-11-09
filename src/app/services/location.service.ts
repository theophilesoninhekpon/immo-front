import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getDepartments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/locations/departments`);
  }

  getCommunes(departmentId?: number): Observable<any> {
    let params = new HttpParams();
    if (departmentId) {
      params = params.set('department_id', departmentId.toString());
    }
    return this.http.get(`${this.apiUrl}/locations/communes`, { params });
  }

  getArrondissements(communeId?: number): Observable<any> {
    let params = new HttpParams();
    if (communeId) {
      params = params.set('commune_id', communeId.toString());
    }
    return this.http.get(`${this.apiUrl}/locations/arrondissements`, { params });
  }

  getTowns(communeId?: number, arrondissementId?: number): Observable<any> {
    let params = new HttpParams();
    if (communeId) {
      params = params.set('commune_id', communeId.toString());
    }
    if (arrondissementId) {
      params = params.set('arrondissement_id', arrondissementId.toString());
    }
    return this.http.get(`${this.apiUrl}/locations/towns`, { params });
  }

  searchLocations(query: string, type: string = 'all'): Observable<any> {
    const params = new HttpParams()
      .set('q', query)
      .set('type', type);
    return this.http.get(`${this.apiUrl}/locations/search`, { params });
  }
}

