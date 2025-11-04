import React, { useState } from 'react';
import { SimpleSubscriptionPrompt } from './SimpleSubscriptionPrompt';
import { useTeam } from '../../contexts/TeamContext';
import {
  DocumentTextIcon,
  ClockIcon,
  ArrowPathIcon,
  UserGroupIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Props {
  showRefreshButton?: boolean;
}

export const SubscriptionStatusCard: React.FC<Props> = ({ showRefreshButton = true }) => {
  const { t } = useTranslation();
  const { currentSubscription: subscription, refreshCurrentSubscription } = useTeam();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCurrentSubscription();
    setIsRefreshing(false);
  };

  if (!subscription) {
    return <SimpleSubscriptionPrompt />;
  }

  const getUsedPageCredit = () => {
    if (subscription.remaining_page_credit === -1) return t('subscription.unlimited');
    const used = subscription.plan_page_credit - subscription.remaining_page_credit;
    return `${used.toLocaleString()} / ${subscription.plan_page_credit.toLocaleString()}`;
  };

  const getUsedDailyPageCredit = () => {
    if (subscription.plan_daily_page_credit === -1) return t('subscription.unlimited');
    const used = subscription.plan_daily_page_credit - subscription.remaining_daily_page_credit;
    return `${used.toLocaleString()} / ${subscription.plan_daily_page_credit.toLocaleString()}`;
  };

  const getUsedTeamMembers = () => {
    if (subscription.plan_number_users === -1) return t('subscription.unlimited');
    const used = subscription.plan_number_users - subscription.remain_number_users;
    return `${used.toLocaleString()} / ${subscription.plan_number_users}`;
  };

  const calculateUsagePercentage = (used: number, total: number) => {
    return Math.min((used / total) * 100, 100);
  };

  return (
    <div className="mb-8">
      <div className="overflow-hidden rounded-lg bg-card shadow">
        <div className="p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-x-3">
                <h3 className="text-lg font-semibold text-foreground">{subscription.plan_name}</h3>
                {subscription.is_default && (
                  <Link
                    to="/dashboard/plans"
                    className="group inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary/20"
                  >
                    {t('subscription.upgradePlan')}
                    <ArrowTopRightOnSquareIcon className="ms-1.5 h-3.5 w-3.5 transform transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>
              {subscription.current_period_end_at ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('subscription.validUntil')}{' '}
                  {new Date(subscription.current_period_end_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('subscription.validForever')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-x-3">
              {showRefreshButton && (
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center justify-center rounded-full p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                  disabled={isRefreshing}
                  title={t('subscription.refreshStatus')}
                >
                  <ArrowPathIcon
                    className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span className="sr-only">{t('subscription.refreshStatus')}</span>
                </button>
              )}
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  subscription.status === 'active'
                    ? 'border border-success/20 bg-success/10 text-success'
                    : 'border border-warning/20 bg-warning/10 text-warning'
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
                <div className="flex items-center gap-x-2">
                  <DocumentTextIcon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {t('subscription.totalPagesCredit')}
                  </span>
                </div>
                <div className="text-sm font-semibold text-foreground">{getUsedPageCredit()}</div>
              </div>
              <div className="overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${calculateUsagePercentage(
                      subscription.plan_page_credit - subscription.remaining_page_credit,
                      subscription.plan_page_credit
                    )}%`,
                  }}
                />
              </div>
              {subscription.remaining_page_credit !== -1 ? (
                <p className="text-xs text-muted-foreground">
                  {Math.round(
                    ((subscription.plan_page_credit - subscription.remaining_page_credit) /
                      subscription.plan_page_credit) *
                      100
                  )}
                  % {t('subscription.used')}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">{t('subscription.unlimited')}</p>
              )}
            </div>

            {/* Daily Pages Credit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-x-2">
                  <ClockIcon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {t('subscription.dailyPagesCredit')}
                  </span>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {getUsedDailyPageCredit()}
                </div>
              </div>
              <div className="overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${calculateUsagePercentage(
                      subscription.plan_daily_page_credit -
                        subscription.remaining_daily_page_credit,
                      subscription.plan_daily_page_credit
                    )}%`,
                  }}
                />
              </div>
              {subscription.plan_daily_page_credit !== -1 ? (
                <p className="text-xs text-muted-foreground">
                  {Math.round(
                    ((subscription.plan_daily_page_credit -
                      subscription.remaining_daily_page_credit) /
                      subscription.plan_daily_page_credit) *
                      100
                  )}
                  % {t('subscription.usedToday')}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">{t('subscription.unlimited')}</p>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {/* Team Members and Crawl Limits Section */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-x-2">
                    <UserGroupIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {t('subscription.teamMembers')}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {getUsedTeamMembers()}
                  </div>
                </div>
                <div className="overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
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
                  <div className="rounded-lg bg-muted p-2 text-center">
                    <div className="text-xs text-muted-foreground">
                      {t('subscription.maxDepth')}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground">
                      {subscription.max_depth !== -1
                        ? subscription.max_depth
                        : t('subscription.unlimited')}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted p-2 text-center">
                    <div className="text-xs text-muted-foreground">
                      {t('subscription.maxConcurrentCrawls')}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground">
                      {subscription.max_concurrent_crawl !== -1
                        ? subscription.max_concurrent_crawl
                        : t('subscription.unlimited')}
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
