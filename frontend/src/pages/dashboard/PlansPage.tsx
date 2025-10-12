import { useEffect, useState } from 'react';
import { Plan } from '../../types/subscription';
import subscriptionApi from '../../services/api/subscription';
import { PlansDisplay } from '../../components/plans/PlansDisplay';
import { useSettings } from '../../contexts/SettingsProvider';
import { NotFoundPage } from '../NotFoundPage';
import { useTranslation } from 'react-i18next';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

export default function PlansPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const { settings } = useSettings();
  const { setItems } = useBreadcrumbs();

  useEffect(() => {
    if (!settings?.is_enterprise_mode_active) {
      return;
    }
    subscriptionApi.getPlans().then(setPlans);
  }, [settings]);

  useEffect(() => {
    setItems([
      {
        label: t('dashboard.title'),
        href: '/dashboard',
      },
      {
        label: t('settings.title'),
        href: '/dashboard/settings',
      },
      {
        label: t('settings.team.billingTab'),
        href: '/dashboard/settings#billing',
      },
      {
        label: t('plans.title'),
        href: '/dashboard/plans',
      },
    ]);
  }, [setItems, t]);

  if (!settings?.is_enterprise_mode_active) {
    return <NotFoundPage />;
  }

  return (
    <div className="py-12 sm:py-16">
      <PlansDisplay 
        plans={plans}
        showHeader={true}
        showEnterprisePlan={true}
        headerTitle={t('plans.title')}
        headerDescription={t('plans.subtitle')}
      />
    </div>
  );
}
