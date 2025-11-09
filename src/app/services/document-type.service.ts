import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentTypeService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getDocumentTypes(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get(`${this.apiUrl}/document-types`, { params: httpParams });
  }

  getDocumentType(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/document-types/${id}`);
  }

  createDocumentType(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/document-types`, data);
  }

  updateDocumentType(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/document-types/${id}`, data);
  }

  deleteDocumentType(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/document-types/${id}`);
  }
}

