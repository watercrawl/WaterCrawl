import React from 'react';
import { ArrowTrendingUpIcon, DocumentTextIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { StatsCard } from './StatsCard';
import { UsageResponse } from '../../types/common';

interface StatsGridProps {
  data: UsageResponse;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Total Crawls"
        value={data.total_crawls?.toLocaleString()}
        icon={<ArrowTrendingUpIcon className="h-5 w-5" />}
      />

      <StatsCard
        title="Total Documents"
        value={data.total_documents?.toLocaleString()}
        icon={<DocumentTextIcon className="h-5 w-5" />}
      />

      <StatsCard
        title="Finished Crawls"
        value={data.finished_crawls?.toLocaleString()}
        icon={<ClockIcon className="h-5 w-5" />}
      />

      <StatsCard
        title="Success Rate"
        value={`${Math.round((data.finished_crawls / data.total_crawls) * 100)}%`}
        rightContent={
          <div className="flex items-center">
            <div className="flex items-center text-green-500">
              <CheckCircleIcon className="h-5 w-5" />
              <span className="ml-1 text-sm">{data.finished_crawls}</span>
            </div>
          </div>
        }
        icon={null}
      />
    </div>
  );
};
