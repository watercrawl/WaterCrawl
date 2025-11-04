import { Team } from './team';
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData extends LoginFormData {
  name: string;
  confirmPassword: string;
}

export interface AuthError {
  message: string;
  field?: string;
}

export interface FormInputProps {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  endAdornment?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export interface ValidationMessageProps {
  message: string | string[];
  type: 'error' | 'success';
}
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface Profile {
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  privacy_confirmed_at: string | null;
  terms_confirmed_at: string | null;
  newsletter_confirmed: boolean;
  is_superuser: boolean;
}

export interface TokenPayload {
  exp: number;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  privacy_confirmed?: boolean;
  terms_confirmed?: boolean;
  newsletter_confirmed?: boolean;
}

export interface Invitation {
  uuid: string;
  team: Team;
  created_at: string;
}
