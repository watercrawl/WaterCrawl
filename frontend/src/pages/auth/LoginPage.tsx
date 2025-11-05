import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { LoginForm } from '../../components/auth/LoginForm';
import { AuthService } from '../../services/authService';

const LoginPage = () => {
  const navigate = useNavigate();
  const authService = AuthService.getInstance();

  useEffect(() => {
    const token = authService.getToken();
    if (token && !authService.isTokenExpired()) {
      navigate('/dashboard');
    }
  }, [authService, navigate]);

  return <LoginForm />;
};

export default LoginPage;
