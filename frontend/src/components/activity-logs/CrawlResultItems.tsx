import React from 'react';
import { CrawlResult } from '../../types/crawl';
import { CrawlResultCard } from './CrawlResultCard';
import { AnimatedProcessing } from '../shared/AnimatedProcessing';

interface CrawlResultItemsProps {
  results: CrawlResult[];
  onPreviewClick: (result: CrawlResult) => void;
  processing?: boolean;
}

export const CrawlResultItems: React.FC<CrawlResultItemsProps> = ({
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
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map((result) => (
            <CrawlResultCard
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
