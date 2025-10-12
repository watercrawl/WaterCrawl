import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { subscriptionApi } from '../../services/api/subscription';
import { Subscription } from '../../types/subscription';
import toast from 'react-hot-toast';
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
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'canceled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <Loading />
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <p className="text-gray-500 dark:text-gray-400">{t('subscriptions.noSubscriptions')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('subscriptions.history')}
        </h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {subscriptions.map((subscription) => (
          <div 
            key={subscription.uuid} 
            className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-x-4">
              {getStatusIcon(subscription.status)}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {subscription.plan.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(subscription.start_at)} - {formatDate(subscription.current_period_end_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {subscription.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
