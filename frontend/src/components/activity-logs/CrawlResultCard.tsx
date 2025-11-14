import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  EyeIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';

import { CrawlResult } from '../../types/crawl';

interface CrawlResultCardProps {
  result: CrawlResult;
  onPreviewClick: (result: CrawlResult) => void;
}

export const CrawlResultCard: React.FC<CrawlResultCardProps> = ({ result, onPreviewClick }) => {
  const { t } = useTranslation();
  const onDownloadClick = (result: CrawlResult) => {
    // download result as blob
    const blob = new Blob([JSON.stringify(result)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.uuid}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="group min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md">
      {/* Header with URL and actions */}
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="shrink-0 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-1.5 shadow-sm">
            <DocumentTextIcon className="h-3.5 w-3.5 text-primary" />
          </div>
          <p
            className="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
            title={result.url}
          >
            {result.url}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 items-center gap-1.5">
          {result.attachments && result.attachments.length > 0 && (
            <div className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
              <PaperClipIcon className="h-3 w-3" />
              <span>{result.attachments.length}</span>
            </div>
          )}
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              onDownloadClick(result);
            }}
            className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            title={t('common.download')}
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              onPreviewClick(result);
            }}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-hover"
          >
            <div className="flex items-center gap-1.5">
              <EyeIcon className="h-4 w-4" />
              <span>{t('common.preview')}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
