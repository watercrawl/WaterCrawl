import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { StatsCard } from './StatsCard';
import { UsageResponse } from '../../types/common';

interface StatsGridProps {
  data: UsageResponse;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ data }) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title={t('stats.totalCrawls')}
        value={data.total_crawls?.toLocaleString()}
        icon={<ArrowTrendingUpIcon className="h-5 w-5" />}
      />

      <StatsCard
        title={t('stats.totalDocuments')}
        value={data.total_documents?.toLocaleString()}
        icon={<DocumentTextIcon className="h-5 w-5" />}
      />

      <StatsCard
        title={t('stats.finishedCrawls')}
        value={data.finished_crawls?.toLocaleString()}
        icon={<ClockIcon className="h-5 w-5" />}
      />

      <StatsCard
        title={t('stats.successRate')}
        value={`${Math.round((data.finished_crawls / data.total_crawls) * 100)}%`}
        rightContent={
          <div className="flex items-center">
            <div className="flex items-center text-success">
              <CheckCircleIcon className="h-5 w-5" />
              <span className="ms-1 text-sm">{data.finished_crawls}</span>
            </div>
          </div>
        }
        icon={null}
      />
    </div>
  );
};
