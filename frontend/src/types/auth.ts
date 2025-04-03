export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface InstallRequest {
  email: string;
  password: string;
  newsletter_confirmed: boolean;
  analytics_confirmed: boolean;
}

export interface User {
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface TokenPayload {
  exp: number;
}
