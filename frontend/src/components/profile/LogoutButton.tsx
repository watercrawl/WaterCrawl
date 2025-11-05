import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

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
      className="inline-flex items-center rounded-md border border-transparent bg-error px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-error-strong focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2"
    >
      {t('profile.logout.button')}
    </button>
  );
}
