import React from 'react';

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  DocumentTextIcon,
  ClockIcon,
  CalendarIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

import { useDateLocale } from '../../hooks/useDateLocale';
import { CrawlStatus } from '../../types/crawl';
import { SitemapRequest, SitemapStatus } from '../../types/sitemap';
import { formatDistanceToNowLocalized } from '../../utils/dateUtils';
import { formatDuration } from '../../utils/formatters';

import { StatusBadge } from './StatusBadge';


interface SitemapRequestCardProps {
  request: SitemapRequest;
}

export const SitemapRequestCard: React.FC<SitemapRequestCardProps> = ({ request }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = useDateLocale();

  const getDurationDisplay = (duration: string | null) => {
    if (request.status === SitemapStatus.Running) {
      return formatDuration(null, request.created_at);
    }
    return formatDuration(duration);
  };

  const getResultCount = () => {
    if (!request.result) return t('sitemap.noResults');
    if (typeof request.result === 'string') return t('sitemap.resultsAvailable');
    return `${request.result.length} ${t('common.results')}`;
  };

  return (
    <div
      className="cursor-pointer overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-colors hover:border-input-border"
      onClick={() => navigate(`/dashboard/logs/sitemaps/${request.uuid}`)}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-x-2">
              <StatusBadge status={request.status as CrawlStatus} />
              {request.duration && (
                <span className="inline-flex items-center text-xs text-muted-foreground">
                  <ClockIcon className="me-1 h-3.5 w-3.5" />
                  {getDurationDisplay(request.duration)}
                </span>
              )}
            </div>
            <h3 className="mt-2 truncate text-sm font-medium text-foreground">{request.url}</h3>
          </div>
          <ArrowTopRightOnSquareIcon className="ms-4 h-5 w-5 flex-shrink-0 text-muted-foreground" />
        </div>
      </div>

      {/* Stats */}
      <div className="border-t border-border">
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="px-4 py-3 sm:px-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <DocumentTextIcon className="me-1.5 h-4 w-4 flex-shrink-0" />
              <span>{getResultCount()}</span>
            </div>
          </div>
          <div className="px-4 py-3 sm:px-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarIcon className="me-1.5 h-4 w-4 flex-shrink-0" />
              <span title={request.created_at ? format(new Date(request.created_at), 'PPpp') : ''}>
                {request.created_at
                  ? formatDistanceToNowLocalized(new Date(request.created_at), dateLocale, {
                      addSuffix: true,
                    })
                  : t('common.unknown')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
