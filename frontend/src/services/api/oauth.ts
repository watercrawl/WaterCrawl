import { OAuthRequest, OAuthResponse } from '../../types/oauth';

import api from './api';

export const oauthApi = {
  /**
   * Authenticate using OAuth provider
   * @param provider - OAuth provider (e.g., 'google', 'github')
   * @param token - Authorization token from OAuth provider
   * @returns Promise with access token, refresh token, and user data
   */
  async authenticate(provider: string, token: string): Promise<OAuthResponse> {
    const request: OAuthRequest = {
      provider,
      token,
    };
    return api.post<OAuthResponse>('/api/v1/user/auth/oauth/', request).then(({ data }) => data);
  },
};
