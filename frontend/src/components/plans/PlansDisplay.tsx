import React, { useState } from 'react';
import { Plan } from '../../types/subscription';
import { PlanCard } from './PlanCard';
import { EnterprisePlan } from './EnterprisePlan';

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
  headerDescription
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('yearly');

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
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      {showHeader && (
        <div className="mx-auto max-w-4xl text-center mb-8">
          {headerTitle && (
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              {headerTitle}
            </h2>
          )}
          {headerDescription && (
            <p className="mt-4 text-base text-gray-600 dark:text-gray-300">
              {headerDescription}
            </p>
          )}
        </div>
      )}
      
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

      {showEnterprisePlan && <EnterprisePlan />}
    </div>
  );
};
