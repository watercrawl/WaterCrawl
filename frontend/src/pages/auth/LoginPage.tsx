import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';
import { AuthService } from '../../services/authService';
import { useSettings } from "../../contexts/SettingsProvider.tsx";

const LoginPage = () => {
  const navigate = useNavigate();
  const authService = AuthService.getInstance();
  const { settings } = useSettings();

  useEffect(() => {
    const token = authService.getToken();
    if (token && !authService.isTokenExpired()) {
      navigate('/dashboard');
    }
  }, [authService, navigate]);

  if (!settings?.is_installed) {
    navigate('/install');
    return null;
  }

  // Don't return null here as we want to show the login form while checking the token
  return (
    <LoginForm />
  );
};

export default LoginPage;
