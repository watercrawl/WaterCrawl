import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { CrawlRequest } from '../../types/crawl';
import {
  DocumentTextIcon,
  ClockIcon,
  CalendarIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { formatDuration } from '../../utils/formatters';
import { StatusBadge } from './StatusBadge';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '../../hooks/useDateLocale';
import { formatDistanceToNowLocalized } from '../../utils/dateUtils';

interface CrawlRequestCardProps {
  request: CrawlRequest;
}

export const CrawlRequestCard: React.FC<CrawlRequestCardProps> = ({ request }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = useDateLocale();

  const getDurationDisplay = (duration: string | null) => {
    if (request.status === 'running') {
      return formatDuration(null, request.created_at);
    }
    return formatDuration(duration);
  };

  return (
    <div
      className="cursor-pointer overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-colors hover:border-input-border"
      onClick={() => navigate(`/dashboard/logs/crawls/${request.uuid}`)}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-x-2">
              <StatusBadge status={request.status} />
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
              <span>
                {request.number_of_documents} {t('common.documents')}
              </span>
            </div>
          </div>
          <div className="px-4 py-3 sm:px-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarIcon className="me-1.5 h-4 w-4 flex-shrink-0" />
              <span title={format(new Date(request.created_at), 'PPpp')}>
                {formatDistanceToNowLocalized(new Date(request.created_at), dateLocale, {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
