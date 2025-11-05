import React from 'react';

import { useTranslation } from 'react-i18next';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

import { SearchResult } from '../../types/search';

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
        <div
          className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-e-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            {t('common.loading')}
          </span>
        </div>
        <p className="ms-2 text-foreground">{t('search.searching')}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-6 text-center text-muted-foreground">{t('search.results.noResults')}</div>
    );
  }

  return (
    <div className="space-y-4">
      {onDownload && (
        <div className="flex justify-end">
          <button
            onClick={e => onDownload(e)}
            className="inline-flex items-center rounded-md border border-input-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <ArrowDownTrayIcon className="me-1.5 h-4 w-4" />
            {t('search.downloadResults')}
          </button>
        </div>
      )}

      <div className="divide-y divide-border overflow-hidden rounded-lg bg-card shadow">
        {results.map((result, idx) => (
          <div key={idx} className="p-4 transition-colors hover:bg-muted">
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="block">
              <h4 className="flex items-center text-base font-medium text-primary hover:underline">
                {result.title}
                {result.depth && (
                  <span className="ms-2 inline-flex items-center rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {result.depth}
                  </span>
                )}
              </h4>
              <p className="mb-1 truncate text-xs text-muted-foreground">{result.url}</p>
            </a>
            <p className="text-sm text-foreground">{result.description || result.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
