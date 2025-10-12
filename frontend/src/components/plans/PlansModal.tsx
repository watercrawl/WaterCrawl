import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Plan } from '../../types/subscription';
import subscriptionApi from '../../services/api/subscription';
import { PlansDisplay } from './PlansDisplay';
import { useSettings } from '../../contexts/SettingsProvider';
import { TeamSelector } from '../dashboard/TeamSelector';

interface PlansModalProps {
  show: boolean;
  onClose?: () => void;
  headerTitle?: string;
  headerDescription?: string;
  showEnterprisePlan?: boolean;
}

export const PlansModal: React.FC<PlansModalProps> = ({
  show,
  onClose,
  showEnterprisePlan = true
}) => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useSettings();

  useEffect(() => {
    if (show && settings?.is_enterprise_mode_active) {
      setIsLoading(true);
      subscriptionApi.getPlans()
        .then(setPlans)
        .finally(() => setIsLoading(false));
    }
  }, [show, settings]);

  if (!show) return null;

  if (!settings?.is_enterprise_mode_active) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('plans.choosePlan')}
          </h3>
          <div className="flex items-center gap-x-2">
            <div className="text-gray-500 dark:text-gray-400">{t('dashboard.settings.team')}:</div>
            <TeamSelector />
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          )}
        </div>
        
        <div className="pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ms-3 text-gray-600 dark:text-gray-300">{t('plans.loadingPlans')}</span>
            </div>
          ) : (
            <PlansDisplay
              plans={plans}
              showHeader={true}
              showEnterprisePlan={showEnterprisePlan}
            />
          )}
        </div>
      </div>
    </div>
  );
};
