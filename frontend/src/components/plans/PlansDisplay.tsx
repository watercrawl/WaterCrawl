import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { Plan } from '../../types/subscription';

import { EnterprisePlan } from './EnterprisePlan';
import { PlanCard } from './PlanCard';

interface PlansDisplayProps {
  plans: Plan[];
  showHeader?: boolean;
  showEnterprisePlan?: boolean;
  headerTitle?: string;
  headerDescription?: string;
}

export const PlansDisplay: React.FC<PlansDisplayProps> = ({
  plans,
  showHeader = true,
  showEnterprisePlan = true,
  headerTitle,
  headerDescription,
}) => {
  const { t } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState<string>('yearly');

  const freePlan = plans.find(plan => plan.is_default);

  const groupedPlans = plans.reduce(
    (acc, plan) => {
      if (!acc[plan.group]) {
        acc[plan.group] = [];
        if (freePlan && plan.group !== freePlan.group) {
          acc[plan.group].push(freePlan);
        }
      }
      acc[plan.group].push(plan);
      return acc;
    },
    {} as Record<string, Plan[]>
  );

  const availableGroups = Object.keys(groupedPlans);
  const currentPlans = groupedPlans[selectedGroup] || [];

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      {showHeader && (
        <div className="mx-auto mb-8 max-w-4xl text-center">
          {headerTitle && (
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {headerTitle}
            </h2>
          )}
          {headerDescription && (
            <p className="mt-4 text-base text-muted-foreground">{headerDescription}</p>
          )}
        </div>
      )}

      {availableGroups.length > 1 && (
        <div className="mt-2 flex justify-center lg:mb-16">
          <div className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs font-semibold leading-5 ring-1 ring-inset ring-border">
            {availableGroups.map(group => (
              <button
                key={group}
                className={`cursor-pointer rounded-full px-2.5 py-1 ${
                  selectedGroup === group ? 'bg-primary-hover text-white' : 'text-muted-foreground'
                }`}
                onClick={() => setSelectedGroup(group)}
              >
                {t(`plans.billing.${group}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="isolate mx-auto mt-8 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        {currentPlans.map(plan => (
          <PlanCard key={plan.uuid} plan={plan} isPopular={Boolean(plan.label)} />
        ))}
      </div>

      {showEnterprisePlan && <EnterprisePlan />}
    </div>
  );
};
