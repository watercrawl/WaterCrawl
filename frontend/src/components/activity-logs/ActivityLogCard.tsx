import React from 'react';
import { CrawlRequest } from '../../types/crawl';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from '../shared/StatusBadge';

interface ActivityLogCardProps {
  request: CrawlRequest;
  onPreviewClick: () => void;
}

export const ActivityLogCard: React.FC<ActivityLogCardProps> = ({ request, onPreviewClick }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {request.url}
        </div>
        <div className="flex items-center justify-between">
          <StatusBadge status={request.status} />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          {request.number_of_documents} documents
        </span>
        <button
          onClick={onPreviewClick}
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          View Results
        </button>
      </div>
    </div>
  );
};
