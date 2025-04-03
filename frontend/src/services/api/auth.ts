import api from './api';
import { AuthResponse, LoginRequest, RegisterRequest, InstallRequest } from '../../types/auth';

export const authApi = {
  async login(request: LoginRequest): Promise<AuthResponse> {
    return api.post('/api/v1/user/auth/login/', request).then(({ data }) => data);
  },

  async register(request: RegisterRequest): Promise<void> {
    return api.post('/api/v1/user/auth/register/', request);
  },

  async install(request: InstallRequest): Promise<null> {
    return api.post('/api/v1/user/install/', request).then(({ data }) => data);
  },

  async verifyEmail(token: string): Promise<AuthResponse> {
    return api.get(`/api/v1/user/auth/verify-email/${token}/`).then(({ data }) => data);
  },

  async forgotPassword(email: string): Promise<void> {
    return api.post('/api/v1/user/auth/forgot-password/', { email });
  },

  async validateResetToken(token: string): Promise<void> {
    return api.get(`/api/v1/user/auth/reset-password/${token}/`).then(({ data }) => data);
  },

  async resetPassword(token: string, password: string): Promise<void> {
    return api.post(`/api/v1/user/auth/reset-password/${token}/`, { password });
  },

  async resendVerificationEmail(email: string): Promise<void> {
    return api.post('/api/v1/user/auth/resend-verify-email/', { email });
  },

  async confirmPrivacyTerms(): Promise<void> {
    return api.post('/api/v1/user/auth/confirm-privacy-terms/');
  },
};

export default authApi;
