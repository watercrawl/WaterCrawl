import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthService } from '../../services/authService';

export function LogoutButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    AuthService.getInstance().removeToken();
    navigate('/');
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
    >
      {t('profile.logout.button')}
    </button>
  );
}
