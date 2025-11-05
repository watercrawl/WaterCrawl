import React from 'react';

import { AnimatedProcessing } from '../shared/AnimatedProcessing';

import { CrawlResult } from '../../types/crawl';

import { CrawlResultCard } from './CrawlResultCard';

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
    <div className="w-full bg-muted px-6 py-4">
      {processing && (
        <div className="flex w-full items-center justify-center">
          <AnimatedProcessing />
        </div>
      )}
      {results.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {results.map(result => (
            <CrawlResultCard key={result.uuid} result={result} onPreviewClick={onPreviewClick} />
          ))}
        </div>
      )}
    </div>
  );
};
