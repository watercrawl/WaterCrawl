import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import Editor from '@monaco-editor/react';

import { useTheme } from '../../contexts/ThemeContext';
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
  const { isDark } = useTheme();
  const [viewMode, setViewMode] = useState<'card' | 'json'>('card');
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
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {results.length} {results.length === 1 ? t('search.result') : t('search.results')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            <button
              type="button"
              onClick={e => {
                e.preventDefault();
                setViewMode('card');
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                viewMode === 'card'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Squares2X2Icon className="h-3.5 w-3.5" />
              <span>{t('common.cards', 'Cards')}</span>
            </button>
            <button
              type="button"
              onClick={e => {
                e.preventDefault();
                setViewMode('json');
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                viewMode === 'json'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CodeBracketIcon className="h-3.5 w-3.5" />
              <span>JSON</span>
            </button>
          </div>

          {/* Download Button */}
          {onDownload && (
            <button
              type="button"
              onClick={e => {
                e.preventDefault();
                onDownload(e);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>{t('search.downloadResults')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Display */}
      {viewMode === 'card' ? (
        <div className="space-y-3">
          {results.map((result, idx) => (
            <div
              key={idx}
              className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <div className="shrink-0 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-1.5 shadow-sm">
                    <DocumentTextIcon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                      {result.title}
                      {result.depth && (
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                          {result.depth}
                        </span>
                      )}
                    </h4>
                    <p className="mb-2 truncate text-xs text-muted-foreground">{result.url}</p>
                    {(result.description || result.snippet) && (
                      <p className="text-sm leading-relaxed text-foreground">
                        {result.description || result.snippet}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                  title={t('common.open', 'Open')}
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ltr h-[600px] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Editor
            height="100%"
            defaultLanguage="json"
            value={JSON.stringify(results, null, 2)}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              wordWrap: 'on',
            }}
            theme={isDark ? 'vs-dark' : 'light'}
          />
        </div>
      )}
    </div>
  );
};
