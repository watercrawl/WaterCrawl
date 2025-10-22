import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResetPasswordForm } from '../../components/auth/ResetPasswordForm';
import { authApi } from '../../services/api/auth';
import Loading from '../../components/shared/Loading';

const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    authApi
      .validateResetToken(token)
      .then(() => {
        setIsValid(true);
      })
      .catch(() => {
        navigate('/');
      })
      .finally(() => {
        setIsValidating(false);
      });
  }, [token, navigate]);

  if (isValidating) {
    return (
      <div className="flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!isValid) {
    return null;
  }

  return token ? <ResetPasswordForm token={token} /> : null;
};

export default ResetPasswordPage;
