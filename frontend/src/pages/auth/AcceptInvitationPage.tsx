import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { authApi } from '../../services/api/auth';
import { profileApi } from '../../services/api/profile';
import { AuthService } from '../../services/authService';
import Loading from '../../components/shared/Loading';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

type InvitationStatus = 'loading' | 'invalid' | 'mismatch-register' | 'mismatch-login' | 'match' | 'accepted';

export default function AcceptInvitationPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [status, setStatus] = useState<InvitationStatus>('loading');
  const [accepting, setAccepting] = useState(false);
  const [invitationUuid, setInvitationUuid] = useState<string | null>(null);

  useEffect(() => {
    const verifyInvitation = async () => {
      if (!code) {
        setStatus('invalid');
        return;
      }

      try {
        const response = await authApi.verifyInvitationCode(code);
        setInvitationUuid(response.uuid);

        // Check if user is logged in by checking for token
        const authService = AuthService.getInstance();
        const token = authService.getToken();

        if (token) {
          if (response.matched_email) {
            setStatus('match');
          } else if (response.new_user) {
            setStatus('mismatch-register');
          } else {
            setStatus('mismatch-login');
          }
        } else {
          if (response.new_user) {
            navigate('/register', {
              state: {
                invitationCode: code
              }
            });
          } else {
            toast(t('notifications.invitation.loginRequired'));
            setTimeout(() => {
              navigate('/');
            }, 2000);
          }
        }
        
      } catch (error: any) {
        // Scenario 1: Invalid invitation
        if (error.response?.status === 404) {
          setStatus('invalid');
        } else {
          toast.error(t('common.error'));
          setStatus('invalid');
        }
      }
    };

    verifyInvitation();
  }, [code, navigate, t]);

  const handleAcceptInvitation = async () => {
    if (!invitationUuid) {
      toast.error(t('profile.invitations.acceptError'));
      return;
    }

    setAccepting(true);
    try {
      await profileApi.acceptInvitation(invitationUuid);
      setStatus('accepted');
      toast.success(t('profile.invitations.acceptSuccess'));

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.log(error);
      toast.error(error.response?.data?.message || t('profile.invitations.acceptError'));
      setAccepting(false);
    }
  };

  const handleLogout = (redirectTo: 'login' | 'register' = 'login') => {
    const authService = AuthService.getInstance();
    authService.removeToken();
    
    if (redirectTo === 'register') {
      navigate('/register', {
        state: {
          invitationCode: code
        }
      });
    } else {
      navigate('/');
    }
  };

  if (status === 'loading') {
    return (
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <Loading size="lg" />
            <p className="mt-4 text-muted-foreground">{t('notifications.invitation.verifying')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <XCircleIcon className="mx-auto h-16 w-16 text-error" />
            <h1 className="mt-4 text-2xl font-bold text-foreground">
              {t('notifications.invitation.invalidTitle')}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t('notifications.invitation.invalidMessage')}
            </p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              {t('common.backToHome')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'mismatch-login') {
    return (
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-warning" />
            <h1 className="mt-4 text-2xl font-bold text-foreground">
              {t('notifications.invitation.mismatchLoginTitle')}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t('notifications.invitation.mismatchLoginMessage')}
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => handleLogout('login')}
                className="w-full rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover"
              >
                {t('notifications.invitation.logoutAndLogin')}
              </button>
              <Link
                to="/dashboard"
                className="block w-full rounded-md border border-border px-6 py-2 text-center text-sm font-medium text-foreground hover:bg-muted"
              >
                {t('dashboard.navigation.backToDashboard')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'mismatch-register') {
    return (
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-warning" />
            <h1 className="mt-4 text-2xl font-bold text-foreground">
              {t('notifications.invitation.mismatchRegisterTitle')}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t('notifications.invitation.mismatchRegisterMessage')}
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => handleLogout('register')}
                className="w-full rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover"
              >
                {t('notifications.invitation.logoutAndRegister')}
              </button>
              <Link
                to="/dashboard"
                className="block w-full rounded-md border border-border px-6 py-2 text-center text-sm font-medium text-foreground hover:bg-muted"
              >
                {t('dashboard.navigation.backToDashboard')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-success" />
            <h1 className="mt-4 text-2xl font-bold text-foreground">
              {t('notifications.invitation.acceptedTitle')}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t('notifications.invitation.acceptedMessage')}
            </p>
            <div className="mt-6">
              <Loading size="md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // status === 'match' - Show confirmation UI
  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircleIcon className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            {t('notifications.invitation.confirmTitle')}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t('notifications.invitation.confirmMessage')}
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={handleAcceptInvitation}
            disabled={accepting}
            className="w-full rounded-md bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {accepting ? (
              <span className="flex items-center justify-center">
                <Loading size="sm" />
                <span className="ms-2">{t('profile.invitations.accepting')}</span>
              </span>
            ) : (
              t('profile.invitations.acceptButton')
            )}
          </button>
          <Link
            to="/dashboard"
            className="block w-full rounded-md border border-border px-6 py-3 text-center text-sm font-medium text-foreground hover:bg-muted"
          >
            {t('common.cancel')}
          </Link>
        </div>
      </div>
    </div>
  );
}
