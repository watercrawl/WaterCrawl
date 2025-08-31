import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon, CheckIcon, UserGroupIcon, InformationCircleIcon, XMarkIcon, BoltIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Plan } from '../../types/subscription';
import { subscriptionApi } from '../../services/api/subscription';
import { toast } from 'react-hot-toast';
import { useTeam } from '../../contexts/TeamContext';
import Button from '../shared/Button';

interface PlanCardProps {
  plan: Plan;
  isPopular?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isPopular,
}) => {
  const { currentTeam, currentSubscription, refreshCurrentSubscription } = useTeam();
  const monthlyPrice = plan.group === 'yearly' ? Number(plan.price) / 12 : Number(plan.price);
  const [loading, setLoading] = useState(false);
  const monthlyPriceBeforeDiscount = plan.price_before_discount
    ? Number(plan.price_before_discount) / 12
    : null;

  let isUsable = true;

  if (!currentTeam?.is_default && plan.is_default) {
    isUsable = false;
  }

  const handleActivate = async () => {
    setLoading(true);
    subscriptionApi
      .createSubscription({ plan_uuid: plan.uuid })
      .then((response) => {
        if (response?.redirect_url) {
          window.location.href = response.redirect_url;
        } else {
          refreshCurrentSubscription().then(() => {
            setLoading(false);
          })
          toast.success('Plan created successfully');
        }
      }).catch((error) => {
        if (error.response?.status === 403) {
          toast.error(error.response?.data?.message || 'You do not have permission to create a subscription');
        } else {
          toast.error('Failed to create subscription');
        }
        console.error('Error creating subscription:', error);
        setLoading(false);
      });
  };

  return (
    <div
      className={`relative p-6 bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 rounded-2xl shadow-sm ${isPopular ? 'lg:z-10 lg:scale-105' : ''
        } ${!isUsable ? 'opacity-60' : ''}`}
    >
      {!isUsable && (
        <div className="absolute inset-0 bg-gray-100/50 dark:bg-gray-900/50 rounded-2xl backdrop-blur-[2px] z-10 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mx-4 text-center max-w-sm">
            <div className="mb-4">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Team Restriction
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              The Free plan is only available for default teams. Please switch to your default team to activate this plan.
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              You can change your team in the navigation menu.
            </div>
          </div>
        </div>
      )}
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-x-1.5 rounded-full bg-blue-100 dark:bg-blue-900 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-100">
          <SparklesIcon className="h-3 w-3" />
          {plan.label || 'Most popular'}
        </span>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-semibold leading-7 text-gray-900 dark:text-white">
          {plan.name}
        </h3>
        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
          {plan.description}
        </p>
        <div className="mt-4 flex flex-col">
          <div className="flex items-baseline gap-x-2">
            {monthlyPriceBeforeDiscount && (
              <span className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-400 line-through">
                €{monthlyPriceBeforeDiscount.toFixed(2)}
              </span>
            )}
            <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              €{monthlyPrice.toFixed(2)}
            </span>
            <span className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-400">
              /Monthly
            </span>
          </div>
          {plan.group === 'yearly' && (
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              €{Number(plan.price).toFixed(2)} billed yearly
            </div>
          )}
          {plan.name === 'Free' && (
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No credit card required
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        {plan.features.map((feature) => (
          <PlanFeature
            key={feature.title}
            label={feature.title}
            helpText={feature.help_text}
            icon={feature.icon}
          />
        ))}
      </div>
      {currentSubscription?.plan_name === plan.name ? (
        <div className="mt-6">
          <Link
            to="/dashboard/settings#billing"
            className="mt-6 w-full block rounded-md bg-gray-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
          >
            Manage subscription
          </Link>
        </div>
      ) : (
        <div className="text-center">
        <Button
          fullWidth
          loading={loading}
          onClick={handleActivate}
          className="mt-6"
        >
          {plan.is_default ? 'Activate Free plan' : 'Activate plan'}
        </Button>
        {plan.is_default && <label className="text-sm font-medium text-green-500 dark:text-green-400">No credit card required</label>}
      </div>
      )}
    </div>
  );
};

interface PlanFeatureProps {
  label: string;
  helpText?: string;
  icon?: string
}

const PlanFeature: React.FC<PlanFeatureProps> = ({ label, helpText, icon }) => (
  <div className="flex items-center gap-x-2">
    {icon === 'info' && (
      <BoltIcon className="h-5 w-5 flex-none text-blue-600 dark:text-blue-400" />
    )}
    {icon === 'cross' && (
      <XMarkIcon className="h-5 w-5 flex-none text-red-600 dark:text-red-400" />
    )}
    {icon === 'check' && (
      <CheckIcon className="h-5 w-5 flex-none text-blue-600 dark:text-blue-400" />
    )}
    {!icon && (
      <ChevronRightIcon className="h-5 w-5 flex-none text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
    )}

    <span className="text-sm leading-6 text-gray-600 dark:text-gray-300">
      {label}
    </span>
    {helpText && (
      <div className="group relative">
        <InformationCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
        <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded py-1 px-2 min-w-[200px] max-w-[300px] shadow-lg">
            {helpText}
            <div className="absolute left-1/2 -translate-x-1/2 top-full">
              <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
