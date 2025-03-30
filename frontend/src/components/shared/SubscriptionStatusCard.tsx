import React, { useState } from 'react';
import { SimpleSubscriptionPrompt } from './SimpleSubscriptionPrompt';
import { useTeam } from '../../contexts/TeamContext';
import { DocumentTextIcon, ClockIcon, ArrowPathIcon, UserGroupIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface Props {
  showRefreshButton?: boolean;
}

export const SubscriptionStatusCard: React.FC<Props> = ({ showRefreshButton = true }) => {
  const { currentSubscription: subscription, refreshCurrentSubscription } = useTeam();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCurrentSubscription();
    setIsRefreshing(false);
  };

  if (!subscription) {
    return <SimpleSubscriptionPrompt />
  }
  
  const getUsedPageCredit = () => {
    if (subscription.remaining_page_credit === -1) return 'Unlimited';
    const used = subscription.plan_page_credit - subscription.remaining_page_credit;
    return `${used.toLocaleString()} / ${subscription.plan_page_credit.toLocaleString()}`;
  };

  const getUsedDailyPageCredit = () => {
    if (subscription.plan_daily_page_credit === -1) return 'Unlimited';
    const used = subscription.plan_daily_page_credit - subscription.remaining_daily_page_credit;
    return `${used.toLocaleString()} / ${subscription.plan_daily_page_credit.toLocaleString()}`;
  };

  const getUsedTeamMembers = () => {
    if (subscription.plan_number_users === -1) return 'Unlimited';
    const used = subscription.plan_number_users - subscription.remain_number_users;
    return `${used.toLocaleString()} / ${subscription.plan_number_users}`;
  };

  const calculateUsagePercentage = (used: number, total: number) => {
    return Math.min((used / total) * 100, 100);
  };



  return (
    <div className="mb-8">
      <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {subscription.plan_name}
                </h3>
                {subscription.is_default && (
                  <Link
                    to="/dashboard/plans"
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-full transition-all duration-200 group"
                  >
                    Upgrade Plan
                    <ArrowTopRightOnSquareIcon className="ml-1.5 h-3.5 w-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                )}
              </div>
              {subscription.current_period_end_at ? (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Valid until{' '}
                  {new Date(subscription.current_period_end_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              ) : (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Valid forever</p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {showRefreshButton && (
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  disabled={isRefreshing}
                  title="Refresh subscription status"
                >
                  <ArrowPathIcon 
                  className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} 
                  aria-hidden="true" 
                />
                <span className="sr-only">Refresh subscription status</span>
              </button>
              )}
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${subscription.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}
              >
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Total Pages Credit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Pages Credit</span>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {getUsedPageCredit()}
                </div>
              </div>
              <div className="overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                  style={{
                    width: `${calculateUsagePercentage(
                      subscription.plan_page_credit - subscription.remaining_page_credit,
                      subscription.plan_page_credit
                    )}%`,
                  }}
                />
              </div>
              {subscription.remaining_page_credit !== -1 ?(
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(((subscription.plan_page_credit - subscription.remaining_page_credit) / subscription.plan_page_credit) * 100)}% used
              </p>
              ):(
                <p className="text-xs text-gray-500 dark:text-gray-400">Unlimited pages credit</p>
              )}
            </div>

            {/* Daily Pages Credit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Pages Credit</span>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {getUsedDailyPageCredit()}
                </div>
              </div>
              <div className="overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
                  style={{
                    width: `${calculateUsagePercentage(
                      subscription.plan_daily_page_credit - subscription.remaining_daily_page_credit,
                      subscription.plan_daily_page_credit
                    )}%`,
                  }}
                />
              </div>
              {subscription.plan_daily_page_credit !== -1 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(((subscription.plan_daily_page_credit - subscription.remaining_daily_page_credit) / subscription.plan_daily_page_credit) * 100)}% used today
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">Unlimited daily pages credit</p>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {/* Team Members and Crawl Limits Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Team Members</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {getUsedTeamMembers()}
                  </div>
                </div>
                <div className="overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600"
                    style={{
                      width: `${calculateUsagePercentage(
                        subscription.plan_number_users - subscription.remain_number_users,
                        subscription.plan_number_users
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Max Depth</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                      {subscription.max_depth !== -1 ? subscription.max_depth : 'Unlimited'}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Max Concurrent Crawls</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                      {subscription.max_concurrent_crawl !== -1 ? subscription.max_concurrent_crawl : 'Unlimited'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatusCard;