import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LoginButton } from '../shared/LoginButton';

interface GithubOAuthProps {
  clientId: string;
  onSuccess: (provider: string, token: string) => void;
  onError: () => void;
}

export default function GithubOAuth({ clientId, onSuccess, onError }: GithubOAuthProps) {
  const { t } = useTranslation();

  useEffect(() => {
    // Check if this is the popup window
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (code || error) {
      try {
        if (window.opener) {
          // Send the code back to the opener window
          window.opener.postMessage(
            {
              type: 'github-oauth',
              code: code || null,
              error: error || null,
            },
            window.location.origin
          );
        }
      } catch (e) {
        console.error('Failed to communicate with opener:', e);
      } finally {
        // Close this window after a short delay
        setTimeout(() => {
          window.close();
        }, 100);
      }
      return;
    }

    // Listen for messages from the popup window
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'github-oauth') {
        if (event.data.error) {
          onError();
          return;
        }

        if (event.data.code) {
          onSuccess('github', event.data.code);
        } else {
          onError();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onError]);

  const handleLogin = () => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // GitHub OAuth URL
    const scope = 'read:user user:email';
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    // Open popup window
    const popup = window.open(
      authUrl,
      'GithubOAuth',
      `width=${width},height=${height},left=${left},top=${top},popup=yes,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    // Check if popup was blocked
    if (!popup || popup.closed) {
      onError();
      return;
    }

    // Poll the popup to check if it's closed prematurely
    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer);
        onError();
      }
    }, 500);
  };

  // If this is the popup window, show a loading message
  if (window.location.search.includes('code=') || window.location.search.includes('error=')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">{t('auth.oauth.authComplete')}</h2>
          <p className="text-muted-foreground">{t('auth.oauth.windowWillClose')}</p>
        </div>
      </div>
    );
  }

  return (
    <LoginButton onClick={handleLogin}>
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
          fill="currentColor"
        />
      </svg>
      <span>{t('auth.oauth.continueWithGithub')}</span>
    </LoginButton>
  );
}
