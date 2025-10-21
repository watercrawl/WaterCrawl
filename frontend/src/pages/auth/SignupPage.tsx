import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { SignupForm } from '../../components/auth/SignupForm';
import { AuthService } from '../../services/authService';
import { authApi } from '../../services/api/auth';
import { VerifyInvitationResponse } from '../../types/auth';
import { useSettings } from '../../contexts/SettingsProvider';

const SignupPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invitation, setInvitation] = useState<VerifyInvitationResponse | null>(null);
  const { settings } = useSettings();
  const authService = AuthService.getInstance();
  const invitationCode = searchParams.get('invitation_code');

  useEffect(() => {
    const token = authService.getToken();
    if (token && !authService.isTokenExpired()) {
      navigate('/dashboard');
    }
  }, [navigate, authService]);

  useEffect(() => {
    if (invitationCode) {
      authApi
        .verifyInvitationCode(invitationCode)
        .then(response => {
          if (!response.new_user) {
            toast.success(t('profile.invitations.acceptSuccess'), {
              duration: 3000,
            });
            navigate('/');
          } else {
            setInvitation(response);
          }
        })
        .catch(error => {
          console.error('Error verifying invitation code:', error);
          toast.error(t('profile.invitations.acceptError'), {
            duration: 3000,
          });
          navigate('/');
        });
    } else {
      if (!settings?.is_signup_active) {
        navigate('/');
      }
    }
  }, [invitationCode, navigate, settings?.is_signup_active, t]);

  return <SignupForm invitation={invitation} />;
};

export default SignupPage;
