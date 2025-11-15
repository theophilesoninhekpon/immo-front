import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  /**
   * Get the full URL for a file stored in Supabase Storage
   * @param filePath The file path from the database (e.g., 'properties/images/abc123.jpg')
   * @returns The full URL to access the file
   */
  getFileUrl(filePath: string | null | undefined): string {
    if (!filePath) {
      return '';
    }

    // If the file path already contains a full URL, return it as is
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }

    // Get Supabase Storage URL from environment or construct it
    // For Supabase Storage with S3, the URL format is typically:
    // https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
    // Or if using S3 endpoint directly: https://[bucket].[endpoint]/[path]
    
    // For now, we'll use the API endpoint and construct the Supabase URL
    // You should add SUPABASE_STORAGE_URL to your environment file
    const supabaseStorageUrl = (environment as any).supabaseStorageUrl ;
    
    // Construct the full URL
    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    // For Supabase Storage public bucket
    return `${supabaseStorageUrl}/storage/v1/object/public/${cleanPath}`;
  }

  /**
   * Get the full URL for a property image
   */
  getImageUrl(filePath: string | null | undefined): string {
    return this.getFileUrl(filePath);
  }

  /**
   * Get the full URL for a document
   */
  getDocumentUrl(filePath: string | null | undefined): string {
    return this.getFileUrl(filePath);
  }
}

