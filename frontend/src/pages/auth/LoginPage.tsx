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
  }, [navigate]);

  // Don't return null here as we want to show the login form while checking the token
  return (
    <LoginForm />
  );
};

export default LoginPage;