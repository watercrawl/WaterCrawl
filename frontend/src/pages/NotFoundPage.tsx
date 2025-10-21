import { Link } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { useTranslation } from 'react-i18next';

export const NotFoundPage = () => {
  const { t } = useTranslation();
  const token = AuthService.getInstance().getToken();
  return (
    <div className="flex min-h-screen items-center justify-center bg-card px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        {/* Error Message */}
        <div className="mb-16">
          <h1 className="text-9xl font-bold text-foreground">404</h1>
          <h2 className="mt-8 text-3xl font-semibold text-foreground">
            {t('errors.notFound.title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('errors.notFound.message')}</p>
        </div>

        {/* Navigation Links */}
        <div className="mx-auto flex max-w-xs flex-col space-y-4">
          {!token ? (
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-6 py-3 text-base font-medium text-white shadow-sm transition-colors duration-200 hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {t('errors.notFound.backHome')}
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-md border border-input-border bg-card px-6 py-3 text-base font-medium text-foreground shadow-sm transition-colors duration-200 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {t('errors.notFound.goToDashboard')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
