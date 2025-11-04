import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SparklesIcon,
  CheckIcon,
  UserGroupIcon,
  InformationCircleIcon,
  XMarkIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { Plan } from '../../types/subscription';
import { subscriptionApi } from '../../services/api/subscription';
import { toast } from 'react-hot-toast';
import { useTeam } from '../../contexts/TeamContext';
import Button from '../shared/Button';
import { ChevronRight } from '../../components/shared/DirectionalIcon';
import { useTranslation } from 'react-i18next';

interface PlanCardProps {
  plan: Plan;
  isPopular?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, isPopular }) => {
  const { t } = useTranslation();
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
      .then(response => {
        if (response?.redirect_url) {
          window.location.href = response.redirect_url;
        } else {
          refreshCurrentSubscription().then(() => {
            setLoading(false);
          });
          toast.success(t('plans.planCreatedSuccess'));
        }
      })
      .catch(error => {
        if (error.response?.status === 403) {
          toast.error(error.response?.data?.message || t('plans.noPermission'));
        } else {
          toast.error(t('plans.createFailed'));
        }
        console.error('Error creating subscription:', error);
        setLoading(false);
      });
  };

  return (
    <div
      className={`relative rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border ${
        isPopular ? 'lg:z-10 lg:scale-105' : ''
      } ${!isUsable ? 'opacity-60' : ''}`}
    >
      {!isUsable && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-muted/50 p-4 backdrop-blur-[2px]">
          <div className="mx-4 max-w-sm rounded-lg bg-card p-6 text-center shadow-lg">
            <div className="mb-4">
              <UserGroupIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              {t('plans.teamRestriction')}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">{t('plans.freePlanRestriction')}</p>
            <div className="text-xs text-muted-foreground">{t('plans.changeTeamHint')}</div>
          </div>
        </div>
      )}
      {isPopular && (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-x-1.5 rounded-full border border-primary bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
          <SparklesIcon className="h-3 w-3 shrink-0" />
          {plan.label || t('plans.mostPopular')}
        </span>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-semibold leading-7 text-foreground">{plan.name}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.description}</p>
        <div className="mt-4 flex flex-col">
          <div className="flex items-baseline gap-x-2">
            {monthlyPriceBeforeDiscount && (
              <span className="text-sm font-semibold leading-6 text-muted-foreground line-through">
                €{monthlyPriceBeforeDiscount.toFixed(2)}
              </span>
            )}
            <span className="text-3xl font-bold tracking-tight text-foreground">
              €{monthlyPrice.toFixed(2)}
            </span>
            <span className="text-sm font-semibold leading-6 text-muted-foreground">
              {t('plans.monthly')}
            </span>
          </div>
          {plan.group === 'yearly' && (
            <div className="mt-1 text-sm text-muted-foreground">
              €{Number(plan.price).toFixed(2)} {t('plans.billedYearly')}
            </div>
          )}
          {plan.name === 'Free' && (
            <div className="mt-1 text-sm text-muted-foreground">{t('plans.noCreditCard')}</div>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        {plan.features.map(feature => (
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
            className="mt-6 block w-full rounded-md bg-muted px-3 py-2 text-center text-sm font-semibold text-foreground shadow-sm hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {t('plans.manageSubscription')}
          </Link>
        </div>
      ) : (
        <div className="text-center">
          <Button fullWidth loading={loading} onClick={handleActivate} className="mt-6">
            {plan.is_default ? t('plans.activateFreePlan') : t('plans.activatePlan')}
          </Button>
          {plan.is_default && (
            <label className="text-sm font-medium text-success">{t('plans.noCreditCard')}</label>
          )}
        </div>
      )}
    </div>
  );
};

interface PlanFeatureProps {
  label: string;
  helpText?: string;
  icon?: string;
}

const PlanFeature: React.FC<PlanFeatureProps> = ({ label, helpText, icon }) => (
  <div className="flex items-center gap-x-2">
    {icon === 'info' && <BoltIcon className="h-5 w-5 flex-none text-primary" />}
    {icon === 'cross' && <XMarkIcon className="h-5 w-5 flex-none text-error" />}
    {icon === 'check' && <CheckIcon className="h-5 w-5 flex-none text-primary" />}
    {!icon && (
      <ChevronRight className="h-5 w-5 flex-none text-muted-foreground hover:text-muted-foreground" />
    )}

    <span className="text-sm leading-6 text-muted-foreground">{label}</span>
    {helpText && (
      <div className="group relative">
        <InformationCircleIcon className="h-5 w-5 text-muted-foreground hover:text-muted-foreground" />
        <div className="pointer-events-none absolute -top-2 left-1/2 z-50 -translate-x-1/2 -translate-y-full opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="min-w-[200px] max-w-[300px] whitespace-normal rounded border border-border bg-muted px-2 py-1 text-xs text-muted-foreground shadow-lg">
            {helpText}
            <div className="absolute left-1/2 top-full -translate-x-1/2">
              <div className="border-4 border-border border-transparent" />
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
