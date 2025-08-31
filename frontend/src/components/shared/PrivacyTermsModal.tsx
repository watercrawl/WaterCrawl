import React, { useState } from 'react';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ScaleIcon,
  FingerPrintIcon
} from '@heroicons/react/24/outline';
import { useSettings } from '../../contexts/SettingsProvider';
import { useUser } from '../../contexts/UserContext';
import { AuthService } from '../../services/authService';
import { toast } from 'react-hot-toast';
import { profileApi } from '../../services/api/profile';
import { Switch } from './Switch';

interface PrivacyTermsModalProps {
  show: boolean;
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({ show }) => {
  const { settings } = useSettings();
  const { refreshUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isNewsletterChecked, setIsNewsletterChecked] = useState(true);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleConfirm = async () => {

    try {
      setIsLoading(true);
      await profileApi.updateProfile({
        privacy_confirmed: true,
        terms_confirmed: true,
        newsletter_confirmed: isNewsletterChecked
      });
      await refreshUser();
      toast.success('Privacy Policy and Terms of Service confirmed');
    } catch (error) {
      toast.error('Failed to confirm Privacy Policy and Terms of Service');
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
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all">
        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <ShieldCheckIcon className="h-12 w-12 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Privacy & Terms Update
            </h2>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              We've recently updated our Privacy Policy and Terms of Service.
              Please review and confirm to continue using WaterCrawl.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <FingerPrintIcon className="h-6 w-6 text-primary-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Privacy Policy
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Last updated: {formatDate(settings.policy_update_at)}
                </p>
              </div>
              <a
                href={settings.policy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline text-sm"
              >
                View
              </a>
            </div>

            <div className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <ScaleIcon className="h-6 w-6 text-primary-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Terms of Service
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Last updated: {formatDate(settings.terms_update_at)}
                </p>
              </div>
              <a
                href={settings.terms_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline text-sm"
              >
                View
              </a>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                I have read and agree to the above Privacy Policy and Terms of Service
              </label>
              {settings?.is_enterprise_mode_active && (
                <Switch
                  label="I would like to receive newsletters"
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
              className="inline-flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium transition-colors"
            >
              <LockClosedIcon className="h-4 w-4 mr-2" />
              Logout
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleConfirm}
              className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isLoading ? 'Confirming...' : 'Accept and Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
