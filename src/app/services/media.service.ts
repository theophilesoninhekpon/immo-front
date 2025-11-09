import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Images
  uploadImages(propertyId: number, images: File[], metadata?: any[]): Observable<any> {
    const formData = new FormData();
    
    images.forEach((image, index) => {
      formData.append(`images[${index}]`, image);
      if (metadata && metadata[index]) {
        if (metadata[index].alt_text) {
          formData.append(`images[${index}][alt_text]`, metadata[index].alt_text);
        }
        if (metadata[index].caption) {
          formData.append(`images[${index}][caption]`, metadata[index].caption);
        }
        if (metadata[index].is_main !== undefined) {
          formData.append(`images[${index}][is_main]`, metadata[index].is_main ? '1' : '0');
        }
        if (metadata[index].is_featured !== undefined) {
          formData.append(`images[${index}][is_featured]`, metadata[index].is_featured ? '1' : '0');
        }
        if (metadata[index].sort_order !== undefined) {
          formData.append(`images[${index}][sort_order]`, metadata[index].sort_order.toString());
        }
      }
    });

    return this.http.post(`${this.apiUrl}/properties/${propertyId}/media/images`, formData);
  }

  getImages(propertyId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/properties/${propertyId}/media/images`);
  }

  updateImage(propertyId: number, imageId: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/properties/${propertyId}/media/images/${imageId}`, data);
  }

  deleteImage(propertyId: number, imageId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/properties/${propertyId}/media/images/${imageId}`);
  }

  setMainImage(propertyId: number, imageId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/properties/${propertyId}/media/images/${imageId}/set-main`, {});
  }

  // Documents
  uploadDocuments(propertyId: number, documents: File[], metadata?: any[]): Observable<any> {
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

    return this.http.post(`${this.apiUrl}/properties/${propertyId}/media/documents`, formData);
  }

  getDocuments(propertyId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/properties/${propertyId}/media/documents`);
  }

  deleteDocument(propertyId: number, documentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/properties/${propertyId}/media/documents/${documentId}`);
  }

  // Vérification des documents (à ajouter au backend si nécessaire)
  verifyDocument(propertyId: number, documentId: number, notes?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/properties/${propertyId}/media/documents/${documentId}/verify`, { notes });
  }

  rejectDocument(propertyId: number, documentId: number, reason: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/properties/${propertyId}/media/documents/${documentId}/reject`, { rejection_reason: reason });
  }

  getDocumentTypes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/document-types`);
  }

  // Vérification des images
  verifyImage(propertyId: number, imageId: number, notes?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/properties/${propertyId}/media/images/${imageId}/verify`, { notes });
  }

  rejectImage(propertyId: number, imageId: number, reason: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/properties/${propertyId}/media/images/${imageId}/reject`, { rejection_reason: reason });
  }
}
