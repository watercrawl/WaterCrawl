import { useEffect, useState } from 'react';
import { Plan } from '../../types/subscription';
import subscriptionApi from '../../services/api/subscription';
import { PlanCard } from '../../components/plans/PlanCard';
import { EnterprisePlan } from '../../components/plans/EnterprisePlan';
import { useSettings } from '../../contexts/SettingsProvider';
import { NotFoundPage } from '../NotFoundPage';

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('yearly');
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

  const freePlan = plans.find((plan) => plan.is_default);

  const groupedPlans = plans.reduce((acc, plan) => {
    if (!acc[plan.group]) {
      acc[plan.group] = [];
      if (freePlan && plan.group !== freePlan.group) {
        acc[plan.group].push(freePlan);
      }
    }
    acc[plan.group].push(plan);
    return acc;
  }, {} as Record<string, Plan[]>);

  const availableGroups = Object.keys(groupedPlans);
  const currentPlans = groupedPlans[selectedGroup] || [];



  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center mb-8">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Choose the right plan for&nbsp;you
          </h2>
          <p className="mt-4 text-base text-gray-600 dark:text-gray-300">
            Select a plan that best fits your needs. All plans include our core features.
          </p>
        </div>
        {availableGroups.length > 1 && (
          <div className="mt-2 flex justify-center lg:mb-16">
            <div className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs font-semibold leading-5 ring-1 ring-inset ring-gray-200 dark:ring-gray-700">
              {availableGroups.map((group) => (
                <button
                  key={group}
                  className={`cursor-pointer rounded-full px-2.5 py-1 ${selectedGroup === group
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 dark:text-gray-400'
                    }`}
                  onClick={() => setSelectedGroup(group)}
                >
                  {group.charAt(0).toUpperCase() + group.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="isolate mx-auto mt-8 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {currentPlans.map((plan) => (
            <PlanCard
              key={plan.uuid}
              plan={plan}
              isPopular={Boolean(plan.label)}
            />
          ))}
        </div>

        <EnterprisePlan />
      </div>
    </div>
  );
}
