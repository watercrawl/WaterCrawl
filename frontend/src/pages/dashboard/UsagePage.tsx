import React, { useState, useEffect, useCallback } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { usageApi } from '../../services/api/usage';
import { UsageResponse } from '../../types/common';
import SubscriptionStatusCard from '../../components/shared/SubscriptionStatusCard';
import UsageStatsGrid from '../../components/shared/UsageStatsGrid';
import UsageCharts from '../../components/shared/UsageCharts';
import { useTeam } from '../../contexts/TeamContext';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useTranslation } from 'react-i18next';

const UsagePage: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UsageResponse | null>(null);
  const { refreshCurrentSubscription } = useTeam();
  const { setItems } = useBreadcrumbs();

  useEffect(() => {
    setItems([
      { label: t('dashboard.title'), href: '/dashboard'},
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
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">{t('usage.errors.loadFailed')}</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-6 space-y-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('usage.title')}</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t('usage.subtitle')}
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
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
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      ) : (
        <>
          {data && <UsageStatsGrid
            totalCrawls={data.total_crawls}
            totalDocuments={data.total_documents}
            finishedCrawls={data.finished_crawls}
          />}

          <SubscriptionStatusCard showRefreshButton={false} />

          {/* Usage Charts */}
          {data && <UsageCharts
            crawlHistory={data.crawl_history}
            documentHistory={data.document_history}
          />}
        </>
      )}
    </div>
  );
};

export default UsagePage;
