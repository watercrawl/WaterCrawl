import { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';

import Loading from '../../components/shared/Loading';
import { authApi } from '../../services/api/auth';
import { AuthService } from '../../services/authService';
import { TeamService } from '../../services/teamService';

const VerifyEmailPage = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError(t('auth.verifyEmail.invalidLink'));
        setIsVerifying(false);
        return;
      }

      try {
        const response = await authApi.verifyEmail(token);
        TeamService.getInstance().removeCurrentTeam();
        AuthService.getInstance().setTokens(response.access, response.refresh);
        setIsVerifying(false);
      } catch (error: any) {
        setError(error.response?.data?.message || t('auth.verifyEmail.genericError'));
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token, navigate, t]);

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10">
        {error ? (
          <>
            <h2 className="mb-6 text-center text-3xl font-extrabold text-foreground">
              {t('auth.verifyEmail.verificationFailed')}
            </h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              {t('auth.verifyEmail.verificationFailedMessage', { error })}
            </p>
            <div className="flex items-center justify-center">
              <Link to="/" className="font-medium text-primary hover:text-primary-strong">
                {t('auth.forgotPassword.backToLogin')}
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="mb-6 text-center text-3xl font-extrabold text-foreground">
              {t('auth.verifyEmail.successTitle')}
            </h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              {t('auth.verifyEmail.successMessage')}
            </p>
            <div>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
              >
                {t('dashboard.navigation.dashboard')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
