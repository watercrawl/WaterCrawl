import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  InstallRequest,
  VerifyInvitationResponse,
  RegisterResponse,
} from '../../types/auth';

import api from './api';

export const authApi = {
  async login(request: LoginRequest): Promise<AuthResponse> {
    return api.post('/api/v1/user/auth/login/', request).then(({ data }) => data);
  },

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    return api.post('/api/v1/user/auth/register/', request).then(({ data }) => data);
  },

  async install(request: InstallRequest): Promise<null> {
    return api.post('/api/v1/user/install/', request).then(({ data }) => data);
  },

  async verifyEmail(token: string): Promise<AuthResponse> {
    return api.get(`/api/v1/user/auth/verify-email/${token}/`).then(({ data }) => data);
  },

  async forgotPassword(email: string): Promise<null> {
    return api.post('/api/v1/user/auth/forgot-password/', { email }).then(({ data }) => data);
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

  async verifyInvitationCode(invitationCode: string): Promise<VerifyInvitationResponse> {
    return api.get(`/api/v1/user/auth/invitation/${invitationCode}/`).then(({ data }) => data);
  },

  // deprecated
  async registerWithInvitation(
    request: RegisterRequest,
    invitationCode: string
  ): Promise<RegisterResponse> {
    return api
      .post(`/api/v1/user/auth/invitation/${invitationCode}/`, { ...request })
      .then(({ data }) => data);
  },
};

export default authApi;
