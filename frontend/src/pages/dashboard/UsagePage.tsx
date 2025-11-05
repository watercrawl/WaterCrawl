import React, { useState, useEffect, useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import { ArrowPathIcon } from '@heroicons/react/24/outline';

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
    <div className="space-y-6 px-8 py-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t('usage.title')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('usage.subtitle')}</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-muted-foreground"
            title={t('usage.refresh')}
          >
            <ArrowPathIcon
              className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span className="sr-only">{t('usage.refresh')}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-border"></div>
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
