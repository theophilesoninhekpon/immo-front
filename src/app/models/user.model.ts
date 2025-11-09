export interface User {
  id: number;
  name: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  verification_status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string;
  verified_at?: string;
  verified_by?: number;
  is_active: boolean;
  last_login_at?: string;
  roles?: Role[];
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  first_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  role: 'admin' | 'vendeur' | 'acheteur';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    token_type: string;
    expires_in: number;
  };
}

