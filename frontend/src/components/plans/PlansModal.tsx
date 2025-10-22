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
  showEnterprisePlan = true,
}) => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useSettings();

  useEffect(() => {
    if (show && settings?.is_enterprise_mode_active) {
      setIsLoading(true);
      subscriptionApi
        .getPlans()
        .then(setPlans)
        .finally(() => setIsLoading(false));
    }
  }, [show, settings]);

  if (!show) return null;

  if (!settings?.is_enterprise_mode_active) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-card shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between rounded-t-2xl border-b border-border bg-card px-6 py-4">
          <h3 className="text-xl font-semibold text-foreground">{t('plans.choosePlan')}</h3>
          <div className="flex items-center gap-x-2">
            <div className="text-muted-foreground">{t('dashboard.settings.team')}:</div>
            <TeamSelector />
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground transition-colors hover:text-muted-foreground"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          )}
        </div>

        <div className="pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
              <span className="ms-3 text-muted-foreground">{t('plans.loadingPlans')}</span>
            </div>
          ) : (
            <PlansDisplay plans={plans} showHeader={true} showEnterprisePlan={showEnterprisePlan} />
          )}
        </div>
      </div>
    </div>
  );
};
