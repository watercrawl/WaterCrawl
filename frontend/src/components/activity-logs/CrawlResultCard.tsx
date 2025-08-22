import React from 'react';
import { ArrowDownTrayIcon, EyeIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { CrawlResult } from '../../types/crawl';

interface CrawlResultCardProps {
  result: CrawlResult;
  onPreviewClick: (result: CrawlResult) => void;
}

export const CrawlResultCard: React.FC<CrawlResultCardProps> = ({
  result,
  onPreviewClick,
}) => {
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
    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        {/* Left Side - Title and URL */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {result.title}
          </h3>
          <a 
            href={result.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs text-gray-500 dark:text-gray-400 hover:underline truncate block mt-1"
            title={result.url}
          >
            {result.url}
          </a>
        </div>

        {/* Right Side - Action Buttons */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              onDownloadClick(result);
            }}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            title="Download"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onPreviewClick(result);
            }}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            title="Preview"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Footer Section - Timestamp and Attachments */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
        </span>
        {result.attachments && result.attachments.length > 0 && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onPreviewClick(result);
            }}
            className="flex items-center text-xs">
            <PaperClipIcon className="h-3.5 w-3.5 mr-1" />
            <span>{result.attachments.length} attachment{result.attachments.length > 1 ? 's' : ''}</span>
          </button>
        )}
      </div>
    </div>
  );
};
