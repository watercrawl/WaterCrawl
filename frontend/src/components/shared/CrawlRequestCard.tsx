import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { CrawlRequest } from '../../types/crawl';
import { DocumentTextIcon, ClockIcon, CalendarIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { formatDuration } from '../../utils/formatters';
import { StatusBadge } from './StatusBadge';

interface CrawlRequestCardProps {
  request: CrawlRequest;
}

export const CrawlRequestCard: React.FC<CrawlRequestCardProps> = ({ request }) => {
  const navigate = useNavigate();

  const getDurationDisplay = (duration: string | null) => {
    if (request.status === 'running') {
      return formatDuration(null, request.created_at);
    }
    return formatDuration(duration);
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
      onClick={() => navigate(`/dashboard/logs/crawls/${request.uuid}`)}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <StatusBadge status={request.status} />
              {request.duration && (
                <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <ClockIcon className="w-3.5 h-3.5 mr-1" />
                  {getDurationDisplay(request.duration)}
                </span>
              )}
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white truncate">
              {request.url}
            </h3>
          </div>
          <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 ml-4" />
        </div>
      </div>

      {/* Stats */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
          <div className="px-4 py-3 sm:px-4">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <DocumentTextIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
              <span>{request.number_of_documents} documents</span>
            </div>
          </div>
          <div className="px-4 py-3 sm:px-4">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
              <span title={format(new Date(request.created_at), 'PPpp')}>
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
