import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { SearchRequest, SearchStatus } from '../../types/search';
import { DocumentTextIcon, ClockIcon, CalendarIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { formatDuration } from '../../utils/formatters';

interface SearchRequestCardProps {
  request: SearchRequest;
}

// Custom status badge for search requests specifically
export const SearchStatusBadge: React.FC<{ status?: SearchStatus }> = ({ status }) => {
  if (!status) return null;
  
  let colorClasses = '';
  
  switch (status) {
    case SearchStatus.New:
      colorClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      break;
    case SearchStatus.Running:
      colorClasses = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      break;
    case SearchStatus.Finished:
      colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      break;
    case SearchStatus.Failed:
      colorClasses = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      break;
    case SearchStatus.Canceled:
      colorClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      break;
    default:
      colorClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}>
      {status}
    </span>
  );
};

export const SearchRequestCard: React.FC<SearchRequestCardProps> = ({ request }) => {
  const navigate = useNavigate();

  const getDurationDisplay = (duration: string | null) => {
    if (request.status === 'running') {
      return formatDuration(null, request.created_at);
    }
    return formatDuration(duration);
  };

  const getResultCount = () => {
    if (!request.result) return '0 results';
    if (typeof request.result === 'string') return 'Results available';
    return `${request.result.length} results`;
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
      onClick={() => navigate(`/dashboard/logs/searches/${request.uuid}`)}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <SearchStatusBadge status={request.status} />
              {request.duration && (
                <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <ClockIcon className="w-3.5 h-3.5 mr-1" />
                  {getDurationDisplay(request.duration)}
                </span>
              )}
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white truncate">
              {request.query}
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
              <span>{getResultCount()}</span>
            </div>
          </div>
          <div className="px-4 py-3 sm:px-4">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
              <span title={request.created_at ? format(new Date(request.created_at), 'PPpp') : ''}>
                {request.created_at ? formatDistanceToNow(new Date(request.created_at), { addSuffix: true }) : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
