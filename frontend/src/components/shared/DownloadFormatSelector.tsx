import React, { useState, useRef, useEffect } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { activityLogsApi } from '../../services/api/activityLogs';
import toast from 'react-hot-toast';

type DownloadFormat = 'json' | 'markdown';

interface DownloadFormatSelectorProps {
  requestId: string;
  className?: string;
  buttonWithText?: boolean;
}

export const DownloadFormatSelector: React.FC<DownloadFormatSelectorProps> = ({
  requestId,
  className = '',
  buttonWithText = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDownload = async (format: DownloadFormat, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!requestId) return;

    try {
      setIsDownloading(true);
      const blob = await activityLogsApi.downloadResults(requestId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crawl-results-${requestId}.${format === 'json' ? 'zip' : 'zip'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading results:', error);
      toast.error('Failed to download results');
    } finally {
      setIsDownloading(false);
      setIsOpen(false);
    }
  };


  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {buttonWithText ? (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 focus:outline-none focus:ring-offset-2 focus:ring-primary-500"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
          Download
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          disabled={isDownloading}
          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          title="Download Results"
        >
          <ArrowDownTrayIcon className={`h-5 w-5 ${isDownloading ? 'animate-pulse' : ''}`} />
        </button>
      )}

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <button
              onClick={(e) => handleDownload('json', e)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Download as JSON
            </button>
            <button
              onClick={(e) => handleDownload('markdown', e)}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Download as Markdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
