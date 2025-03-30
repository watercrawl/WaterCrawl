import React from 'react';
import { CrawlResult } from '../../types/crawl';
import { ActivityLogResultCard } from './ActivityLogResultCard';
import { AnimatedProcessing } from '../shared/AnimatedProcessing';

interface ActivityLogExpandedRowProps {
  isLoading: boolean;
  results: CrawlResult[];
  onPreviewClick: (result: CrawlResult) => void;
  processing?: boolean;
}

export const ActivityLogExpandedRow: React.FC<ActivityLogExpandedRowProps> = ({
  isLoading,
  results,
  onPreviewClick,
  processing,
}) => {
  return (
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 w-full">
        {processing && (
          <div className="flex items-center justify-center w-full">
            <AnimatedProcessing />
          </div>
        )}
        {isLoading ? (
          <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map((result) => (
              <ActivityLogResultCard
                key={result.uuid}
                result={result}
                onPreviewClick={onPreviewClick}
              />
            ))}
          </div>
        )}
      </div>
  );
};
