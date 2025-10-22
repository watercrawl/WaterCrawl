import React from 'react';
import { ArrowDownTrayIcon, EyeIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import { CrawlResult } from '../../types/crawl';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '../../hooks/useDateLocale';
import { formatDistanceToNowLocalized } from '../../utils/dateUtils';

interface CrawlResultCardProps {
  result: CrawlResult;
  onPreviewClick: (result: CrawlResult) => void;
}

export const CrawlResultCard: React.FC<CrawlResultCardProps> = ({ result, onPreviewClick }) => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
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
    <div className="rounded-md border border-border p-3">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        {/* Left Side - Title and URL */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-foreground">{result.title}</h3>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block truncate text-xs text-muted-foreground hover:underline"
            title={result.url}
          >
            {result.url}
          </a>
        </div>

        {/* Right Side - Action Buttons */}
        <div className="ms-4 flex items-center gap-x-2">
          <button
            onClick={e => {
              e.preventDefault();
              onDownloadClick(result);
            }}
            className="p-1.5 text-muted-foreground hover:text-foreground"
            title={t('common.download')}
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>
          <button
            onClick={e => {
              e.preventDefault();
              onPreviewClick(result);
            }}
            className="p-1.5 text-muted-foreground hover:text-foreground"
            title={t('common.preview')}
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Footer Section - Timestamp and Attachments */}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {formatDistanceToNowLocalized(new Date(result.created_at), dateLocale, {
            addSuffix: true,
          })}
        </span>
        {result.attachments && result.attachments.length > 0 && (
          <button
            onClick={e => {
              e.preventDefault();
              onPreviewClick(result);
            }}
            className="flex items-center text-xs"
          >
            <PaperClipIcon className="me-1 h-3.5 w-3.5" />
            <span>
              {result.attachments.length}{' '}
              {t('crawl.results.attachment', { count: result.attachments.length })}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
