import React, { useState, useEffect, useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import { ArrowPathIcon } from '@heroicons/react/24/outline';

import Loading from '../../components/shared/Loading';
import PageHeader from '../../components/shared/PageHeader';
import SubscriptionStatusCard from '../../components/shared/SubscriptionStatusCard';
import UsageCharts from '../../components/shared/UsageCharts';
import UsageStatsGrid from '../../components/shared/UsageStatsGrid';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useTeam } from '../../contexts/TeamContext';
import { usageApi } from '../../services/api/usage';
import { UsageResponse } from '../../types/common';

const UsagePage: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UsageResponse | null>(null);
  const { refreshCurrentSubscription } = useTeam();
  const { setItems } = useBreadcrumbs();

  useEffect(() => {
    setItems([
      { label: t('dashboard.title'), href: '/dashboard' },
      { label: t('usage.title'), href: '/dashboard/usage', current: true },
    ]);
  }, [setItems, t]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // rewrite with promiss  all
      const [response] = await Promise.all([
        usageApi.getUsageStats(),
        refreshCurrentSubscription(),
      ]);
      setData(response);
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  }, [refreshCurrentSubscription]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!loading && !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t('usage.errors.loadFailed')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        titleKey="usage.title"
        descriptionKey="usage.subtitle"
        actions={
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            title={t('usage.refresh')}
          >
            <ArrowPathIcon
              className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span className="sr-only">{t('usage.refresh')}</span>
          </button>
        }
      />

      {loading ? (
        <div className="flex h-[320px] items-center justify-center">
          <Loading />
        </div>
      ) : (
        <>
          {data && (
            <UsageStatsGrid
              totalCrawls={data.total_crawls}
              totalDocuments={data.total_documents}
              finishedCrawls={data.finished_crawls}
            />
          )}

          <SubscriptionStatusCard showRefreshButton={false} />

          {/* Usage Charts */}
          {data && (
            <UsageCharts
              crawlHistory={data.crawl_history}
              documentHistory={data.document_history}
            />
          )}
        </>
      )}
    </div>
  );
};

export default UsagePage;
