import React from 'react';
import {
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface UsageStatsGridProps {
  totalCrawls: number;
  totalDocuments: number;
  finishedCrawls: number;
}

export const UsageStatsGrid: React.FC<UsageStatsGridProps> = ({
  totalCrawls,
  totalDocuments,
  finishedCrawls,
}) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t('usage.stats.totalCrawlRequests')}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {totalCrawls?.toLocaleString()}
            </p>
          </div>
          <div className="text-muted-foreground">
            <ArrowTrendingUpIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t('usage.stats.totalResults')}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {totalDocuments?.toLocaleString()}
            </p>
          </div>
          <div className="text-muted-foreground">
            <DocumentTextIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="hidden rounded-lg border border-border p-4 md:block">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t('usage.stats.finishedCrawls')}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {finishedCrawls?.toLocaleString()}
            </p>
          </div>
          <div className="text-muted-foreground">
            <ClockIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="hidden rounded-lg border border-border p-4 md:block">
        <div className="flex items-center justify-between gap-x-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('usage.stats.successRate')}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {Math.round((finishedCrawls / totalCrawls) * 100)}%
            </p>
          </div>
          <div className="flex items-center">
            <div className="flex items-center text-success">
              <CheckCircleIcon className="h-5 w-5" />
              <span className="ms-1 text-sm">{finishedCrawls}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageStatsGrid;
