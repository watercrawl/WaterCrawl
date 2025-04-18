import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CrawlRequest } from '../../types/crawl';
import { StatusBadge } from '../shared/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDownIcon, ChevronRightIcon, EyeIcon } from '@heroicons/react/24/outline';
import { DownloadFormatSelector } from '../shared/DownloadFormatSelector';
import { SitemapModalSelector } from '../shared/SitemapModalSelector';

interface ActivityLogRowProps {
  request: CrawlRequest;
  isExpanded?: boolean;
  onRowClick?: () => void;
  showDates?: boolean;
}

export const ActivityLogRow: React.FC<ActivityLogRowProps> = ({
                                                                request,
                                                                isExpanded = false,
                                                                onRowClick,
                                                                showDates = true
                                                              }) => {
  const navigate = useNavigate();

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!request.uuid) return;
    navigate(`/dashboard/logs/${request.uuid}`);
  };

  return (
    <tr
      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors duration-200 ${
        isExpanded ? 'bg-gray-50 dark:bg-gray-800/50' : ''
      }`}
      onClick={(e) => {
        e.preventDefault();
        onRowClick?.();
      }}
    >
      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
        <div className="flex items-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRowClick?.();
            }}
            className="mr-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-5 w-5"/>
            ) : (
              <ChevronRightIcon className="h-5 w-5"/>
            )}
          </button>
          <span className="max-w-sm truncate" title={request.url}>
            {request.url}
          </span>
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        <StatusBadge status={request.status}/>
      </td>
      {showDates && (
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {formatDistanceToNow(new Date(request.created_at), {addSuffix: true})}
        </td>
      )}
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {request.number_of_documents}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-3">
          <DownloadFormatSelector request={request}/>
          <SitemapModalSelector request={request} />
          <button
            onClick={handleViewDetails}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            title="View Details"
          >
            <EyeIcon className="h-5 w-5"/>
          </button>
        </div>
      </td>
    </tr>
  );
};
