import React, { useState } from 'react';

import { GoogleOAuthProvider } from '@react-oauth/google';

import { ValidationMessage } from '../shared/ValidationMessage';

import { useSettings } from '../../contexts/SettingsProvider';
import { oauthApi } from '../../services/api/oauth';
import { AuthService } from '../../services/authService';
import { TeamService } from '../../services/teamService';

import GithubOAuth from './GithubOAuth';
import GoogleOAuth from './GoogleOAuth';

export const OAuthButtons: React.FC = () => {
  const { settings } = useSettings();
  const [error, setError] = useState<string | null>(null);

  const onSuccess = (provider: string, token: string) => {
    oauthApi
      .authenticate(provider, token)
      .then(response => {
        TeamService.getInstance().removeCurrentTeam();
        AuthService.getInstance().setTokens(response.access, response.refresh);
        window.location.href = '/dashboard';
      })
      .catch(err => {
        console.log(err);
        if (err.response?.status === 400) {
          setError(err.response?.data?.message || 'Login Failed');
        } else {
          setError(err.message);
        }
      });
  };

  const onError = () => {
    setError('Login Failed');
  };

  return (
    <div className="space-y-3">
      {error && <ValidationMessage message={error} type="error" />}
      {settings?.is_google_login_active && (
        <GoogleOAuthProvider clientId={settings.google_client_id as string}>
          <GoogleOAuth onSuccess={onSuccess} onError={onError} />
        </GoogleOAuthProvider>
      )}
      {settings?.is_github_login_active && (
        <GithubOAuth
          clientId={settings.github_client_id as string}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}
    </div>
  );
};
