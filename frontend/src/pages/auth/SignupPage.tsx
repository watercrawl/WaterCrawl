import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignupForm } from '../../components/auth/SignupForm';
import { AuthService } from '../../services/authService';

const SignupPage = () => {
  const navigate = useNavigate();
  const authService = AuthService.getInstance();

  useEffect(() => {
    const token = authService.getToken();
    if (token && !authService.isTokenExpired()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <SignupForm />
  );
};

export default SignupPage;

