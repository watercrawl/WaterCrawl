import React, { useState } from 'react';

import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ScaleIcon,
  FingerPrintIcon,
} from '@heroicons/react/24/outline';

import { useSettings } from '../../contexts/SettingsProvider';
import { useUser } from '../../contexts/UserContext';
import { profileApi } from '../../services/api/profile';
import { AuthService } from '../../services/authService';

import { Switch } from './Switch';

interface PrivacyTermsModalProps {
  show: boolean;
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({ show }) => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { refreshUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isNewsletterChecked, setIsNewsletterChecked] = useState(true);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await profileApi.updateProfile({
        privacy_confirmed: true,
        terms_confirmed: true,
        newsletter_confirmed: isNewsletterChecked,
      });
      await refreshUser();
      toast.success(t('privacy.confirmSuccess'));
    } catch (error) {
      toast.error(t('privacy.confirmError'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error(error);
    }
  };

  if (!show || !settings) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-2xl transform rounded-2xl bg-card shadow-2xl transition-all">
        <div className="space-y-6 p-6">
          <div className="flex items-center gap-x-4">
            <ShieldCheckIcon className="h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">{t('privacy.title')}</h2>
          </div>

          <div className="flex items-start gap-x-3 rounded-lg border border-primary bg-primary-soft p-4">
            <ExclamationTriangleIcon className="mt-1 h-6 w-6 flex-shrink-0 text-warning" />
            <p className="text-sm text-foreground">{t('privacy.updateMessage')}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-x-3 rounded-lg bg-muted p-3">
              <FingerPrintIcon className="h-6 w-6 flex-shrink-0 text-primary" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {t('privacy.policyTitle')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('privacy.lastUpdated')}: {formatDate(settings.policy_update_at)}
                </p>
              </div>
              <a
                href={settings.policy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {t('common.view')}
              </a>
            </div>

            <div className="flex items-center gap-x-3 rounded-lg bg-muted p-3">
              <ScaleIcon className="h-6 w-6 flex-shrink-0 text-primary" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">{t('privacy.termsTitle')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('privacy.lastUpdated')}: {formatDate(settings.terms_update_at)}
                </p>
              </div>
              <a
                href={settings.terms_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {t('common.view')}
              </a>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-foreground">
                {t('privacy.agreeMessage')}
              </label>
              {settings?.is_enterprise_mode_active && (
                <Switch
                  label={t('privacy.newsletter')}
                  checked={isNewsletterChecked}
                  onChange={setIsNewsletterChecked}
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <LockClosedIcon className="me-2 h-4 w-4" />
              {t('auth.logout')}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleConfirm}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <svg
                  className="me-2 h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : null}
              {isLoading ? t('common.loading') : t('privacy.acceptButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
