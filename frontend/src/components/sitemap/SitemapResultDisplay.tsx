import React, { useState, useEffect, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { DocumentChartBarIcon, CodeBracketSquareIcon } from '@heroicons/react/24/outline';

import Button from '../shared/Button';

import { sitemapApi } from '../../services/api/sitemap';
import { SitemapGraph } from '../../types/crawl';
import { SitemapRequest, SitemapStatus } from '../../types/sitemap';

import SitemapGraphViewer from './SitemapGraphViewer';
import SitemapMarkdownViewer from './SitemapMarkdownViewer';



interface SitemapResultDisplayProps {
  result?: SitemapRequest;
  loading?: boolean;
}

type ViewMode = 'json' | 'graph' | 'markdown';

export const SitemapResultDisplay: React.FC<SitemapResultDisplayProps> = ({
  result,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('json');
  const [sitemapGraph, setSitemapGraph] = useState<SitemapGraph | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [isLoadingMarkdown, setIsLoadingMarkdown] = useState(false);

  const fetchSitemapGraph = useCallback(async () => {
    if (!result || !result.uuid || result.status !== SitemapStatus.Finished) return;

    try {
      setIsLoadingGraph(true);
      const graphData = await sitemapApi.getGraph(result.uuid);

      // Transform the sitemap graph structure if needed
      // This handles potential type differences between sitemap.ts and crawl.ts SitemapGraph types
      const transformedGraph = graphData as unknown as SitemapGraph;
      setSitemapGraph(transformedGraph);
      setViewMode('graph');
    } catch (error) {
      console.error('Error loading sitemap graph:', error);
      toast.error(t('sitemap.errors.loadGraphFailed'));
    } finally {
      setIsLoadingGraph(false);
    }
  }, [result, t]);

  const fetchSitemapMarkdown = useCallback(async () => {
    if (!result || !result.uuid || result.status !== SitemapStatus.Finished) return;

    try {
      setIsLoadingMarkdown(true);
      const data = await sitemapApi.getMarkdown(result.uuid);
      setMarkdownContent(data);
      setViewMode('markdown');
    } catch (error) {
      console.error('Error loading sitemap markdown:', error);
      toast.error(t('sitemap.errors.loadMarkdownFailed'));
      // Fall back to json view if markdown fails to load
      setViewMode('json');
    } finally {
      setIsLoadingMarkdown(false);
    }
  }, [result, t]);

  useEffect(() => {
    if (result && result.status === SitemapStatus.Finished) {
      if (viewMode === 'graph') {
        fetchSitemapGraph();
      } else if (viewMode === 'markdown') {
        fetchSitemapMarkdown();
      }
    }
  }, [result, viewMode, fetchSitemapGraph, fetchSitemapMarkdown]);

  if (!result) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">{t('sitemap.noSitemapYet')}</p>
      </div>
    );
  }

  if (loading && result.status === SitemapStatus.Running) {
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
        <span className="ms-2 text-foreground">{t('sitemap.generatingSitemap')}</span>
      </div>
    );
  }

  if (result.status === SitemapStatus.Failed) {
    return (
      <div className="rounded-md border border-error bg-error-soft p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-error"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ms-3">
            <h3 className="text-sm font-medium text-error">{t('sitemap.generationFailed')}</h3>
            <div className="mt-2 text-sm text-error">
              <p>{t('sitemap.generationError')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === SitemapStatus.Canceled) {
    return (
      <div className="rounded-md border border-warning bg-warning-soft p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-warning"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ms-3">
            <h3 className="text-sm font-medium text-warning-strong">
              {t('sitemap.generationCanceled')}
            </h3>
            <div className="mt-2 text-sm text-warning-strong">
              <p>{t('sitemap.generationCanceledMessage')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === SitemapStatus.Finished) {
    return (
      <div className="ltr space-y-6">
        {result.result && Array.isArray(result.result) && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t('sitemap.foundUrls', { count: result.result.length })}
            </span>
            <div className="flex gap-x-2">
              {/* View toggle buttons */}
              <Button
                size="sm"
                variant={viewMode === 'json' ? 'primary' : 'outline'}
                onClick={() => setViewMode('json')}
                disabled={isLoadingGraph}
              >
                <CodeBracketSquareIcon className="h-4 w-4" />
                JSON
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'graph' ? 'primary' : 'outline'}
                onClick={() => fetchSitemapGraph()}
                loading={isLoadingGraph}
                disabled={isLoadingGraph}
              >
                <DocumentChartBarIcon className="h-4 w-4" />
                Graph
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'markdown' ? 'primary' : 'outline'}
                onClick={() => fetchSitemapMarkdown()}
                loading={isLoadingMarkdown}
                disabled={isLoadingMarkdown}
              >
                <CodeBracketSquareIcon className="h-4 w-4" />
                Markdown
              </Button>
            </div>
          </div>
        )}

        {viewMode === 'json' && (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
              <h3 className="text-sm font-medium text-foreground">{t('sitemap.urlList')}</h3>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              <pre className="whitespace-pre-wrap break-all font-mono text-sm text-foreground">
                {JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {viewMode === 'graph' && (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
              <h3 className="text-sm font-medium text-foreground">{t('sitemap.structure')}</h3>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              <SitemapGraphViewer sitemapData={sitemapGraph} isLoading={isLoadingGraph} />
            </div>
            <div className="border-t border-border bg-muted px-4 py-3 text-xs text-muted-foreground">
              <p>• {t('sitemap.tips.expandFolders')}</p>
              <p>• {t('sitemap.tips.clickLinks')}</p>
            </div>
          </div>
        )}

        {viewMode === 'markdown' && (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
              <h3 className="text-sm font-medium text-foreground">{t('sitemap.markdown')}</h3>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              <SitemapMarkdownViewer
                markdownContent={markdownContent}
                isLoading={isLoadingMarkdown}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="py-8 text-center">
      <p className="text-muted-foreground">
        {result.status === SitemapStatus.New ? t('sitemap.waitingToStart') : t('common.loading')}
      </p>
    </div>
  );
};
