import React, { useState, useEffect } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

import { subscriptionApi } from '../../services/api/subscription';
import { Subscription } from '../../types/subscription';

import Loading from './Loading';

export const SubscriptionsList: React.FC = () => {
  const { t } = useTranslation();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        const data = await subscriptionApi.getSubscriptions();
        setSubscriptions(data);
      } catch (error) {
        toast.error(t('subscriptions.errors.fetchFailed'));
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [t]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-success" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-warning" />;
      case 'canceled':
        return <XCircleIcon className="h-5 w-5 text-error" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="rounded-lg bg-card p-6 shadow-md">
        <Loading />
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="rounded-lg bg-card p-6 shadow-md">
        <p className="text-muted-foreground">{t('subscriptions.noSubscriptions')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-card shadow-md">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold text-foreground">{t('subscriptions.history')}</h3>
      </div>
      <div className="divide-y divide-border">
        {subscriptions.map(subscription => (
          <div
            key={subscription.uuid}
            className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-x-4">
              {getStatusIcon(subscription.status)}
              <div>
                <p className="text-sm font-medium text-foreground">{subscription.plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(subscription.start_at)} -{' '}
                  {formatDate(subscription.current_period_end_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-x-4">
              <div className="text-sm capitalize text-muted-foreground">{subscription.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
