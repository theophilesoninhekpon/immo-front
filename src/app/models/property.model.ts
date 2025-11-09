import { User } from "./user.model";

export interface Property {
  id: number;
  reference?: string;
  title: string;
  description: string;
  property_type_id: number;
  price: number;
  surface_area: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  year_built?: number;
  is_furnished?: boolean;
  has_parking?: boolean;
  has_garden?: boolean;
  has_pool?: boolean;
  has_balcony?: boolean;
  has_elevator?: boolean;
  address_id: number;
  owner_id: number;
  status: 'available' | 'sold' | 'pending_verification' | 'rejected';
  rejection_reason?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  property_type?: PropertyType;
  address?: Address;
  owner?: User;
  images?: PropertyImage[];
  documents?: Document[];
}

export interface PropertyType {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface Address {
  id: number;
  street_address: string;
  department_id: number;
  commune_id: number;
  arrondissement_id?: number;
  town_id?: number;
  latitude?: number;
  longitude?: number;
  department?: Department;
  commune?: Commune;
  arrondissement?: Arrondissement;
  town?: Town;
}

export interface Department {
  id: number;
  name: string;
  code: string;
}

export interface Commune {
  id: number;
  name: string;
  department_id: number;
}

export interface Arrondissement {
  id: number;
  name: string;
  commune_id: number;
}

export interface Town {
  id: number;
  name: string;
  arrondissement_id: number;
}

export interface PropertyImage {
  id: number;
  property_id: number;
  name: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  alt_text?: string;
  caption?: string;
  width?: number;
  height?: number;
  sort_order: number;
  is_main: boolean;
  is_featured: boolean;
  is_active: boolean;
}

export interface Document {
  id: number;
  documentable_type: string;
  documentable_id: number;
  document_type_id: number;
  name: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  hash: string;
  description?: string;
  status: 'pending' | 'verified' | 'rejected';
  document_type?: DocumentType;
}

export interface DocumentType {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface PropertyFeature {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface PropertyRequest {
  title: string;
  description: string;
  property_type_id: number;
  price: number;
  surface_area: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  year_built?: number;
  is_furnished?: boolean;
  has_parking?: boolean;
  has_garden?: boolean;
  has_pool?: boolean;
  has_balcony?: boolean;
  has_elevator?: boolean;
  street_address: string;
  department_id: number;
  commune_id: number;
  arrondissement_id?: number;
  town_id?: number;
  latitude?: number;
  longitude?: number;
}

