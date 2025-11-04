import { useState } from 'react';
import { useCookieConsent } from '../contexts/CookieConsentContext';
import { CheckCircle, Cookie, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CookieConsentModal from './CookieConsentModal';
import { useSettings } from '../../contexts/SettingsProvider.tsx';

export const CookieConsentBanner: React.FC = () => {
  const { t } = useTranslation();
  const { isConsentGiven, updateConsent, categories, isClient } = useCookieConsent();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { settings, loading } = useSettings();

  const handleAcceptAll = () => {
    const allNonEssentialCategories = categories.filter(cat => !cat.essential).map(cat => cat.id);

    updateConsent(allNonEssentialCategories);
  };

  if (!isClient || isConsentGiven || !settings?.is_enterprise_mode_active || loading) return null;

  return (
    <>
      {!isModalOpen && (
        <div
          className={
            'fixed bottom-4 end-4 start-4 z-[100] flex flex-col items-start gap-4 rounded-lg border-border bg-card p-4 text-foreground shadow-lg transition-all duration-300 ease-in-out sm:flex-row sm:items-center sm:justify-between sm:gap-0'
          }
        >
          <div className="flex w-full items-center gap-x-4 sm:w-auto">
            <Cookie className="h-6 w-6 shrink-0 text-primary" />
            <p className="text-sm font-medium">{t('cookieConsent.banner.message')}</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex w-full items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover sm:w-auto"
            >
              <Settings className="me-2 h-4 w-4 shrink-0" />
              {t('cookieConsent.banner.manageCookies')}
            </button>
            <button
              onClick={handleAcceptAll}
              className="flex w-full items-center justify-center whitespace-nowrap rounded-md bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success sm:w-auto"
            >
              <CheckCircle className="me-2 h-4 w-4 shrink-0" />
              {t('cookieConsent.banner.acceptAll')}
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <CookieConsentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};

export default CookieConsentBanner;
