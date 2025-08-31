import { useEffect, useState } from 'react';
import { Plan } from '../../types/subscription';
import subscriptionApi from '../../services/api/subscription';
import { PlansDisplay } from '../../components/plans/PlansDisplay';
import { useSettings } from '../../contexts/SettingsProvider';
import { NotFoundPage } from '../NotFoundPage';

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const { settings } = useSettings();

  useEffect(() => {
    if (!settings?.is_enterprise_mode_active) {
      return;
    }
    subscriptionApi.getPlans().then(setPlans);
  }, [settings]);

  if (!settings?.is_enterprise_mode_active) {
    return <NotFoundPage />;
  }

  return (
    <div className="py-12 sm:py-16">
      <PlansDisplay 
        plans={plans}
        showHeader={true}
        showEnterprisePlan={true}
        headerTitle="Choose the right plan for you"
        headerDescription="Select a plan that best fits your needs. All plans include our core features."
      />
    </div>
  );
}
