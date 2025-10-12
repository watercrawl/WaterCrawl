import React from 'react';
import { useTranslation } from 'react-i18next';
import { SearchResult } from '../../types/search';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface SearchResultDisplayProps {
  results: SearchResult[];
  loading?: boolean;
  onDownload?: (e: React.MouseEvent) => void;
}

export const SearchResultDisplay: React.FC<SearchResultDisplayProps> = ({ 
  results, 
  loading = false,
  onDownload,
}) => {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary-500 border-e-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">{t('common.loading')}</span>
        </div>
        <p className="ms-2 text-gray-700 dark:text-gray-300">
          {t('search.searching')}
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
        {t('search.results.noResults')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onDownload && (
        <div className="flex justify-end">
          <button
            onClick={(e) => onDownload(e)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowDownTrayIcon className="h-4 w-4 me-1.5" />
            {t('search.downloadResults')}
          </button>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
        {results.map((result, idx) => (
          <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <a 
              href={result.url} 
              target="_blank"
              rel="noopener noreferrer" 
              className="block"
            >
              <h4 className="text-primary-600 dark:text-primary-400 font-medium hover:underline text-base flex items-center">
                {result.title}
                {result.depth && (
                  <span className="ms-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {result.depth}
                  </span>
                )}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">
                {result.url}
              </p>
            </a>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {result.description || result.snippet}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
