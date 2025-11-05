import { useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { SignupForm } from '../../components/auth/SignupForm';
import { useSettings } from '../../contexts/SettingsProvider';
import { AuthService } from '../../services/authService';

const SignupPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const authService = AuthService.getInstance();
  const location = useLocation();
  const { state } = location;

  useEffect(() => {
    const token = authService.getToken();
    if (token && !authService.isTokenExpired()) {
      navigate('/dashboard');
    }
  }, [navigate, authService]);

  useEffect(() => {
    if (!state?.invitationCode && !settings?.is_signup_active) {
      navigate('/');
    }
  }, [state?.invitationCode, navigate, settings?.is_signup_active, t]);

  return <SignupForm invitationCode={state?.invitationCode} />;
};

export default SignupPage;
