import React, { useState, useEffect, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import {
  ChartBarIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Editor from '@monaco-editor/react';

import { useTheme } from '../../contexts/ThemeContext';
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
  const { isDark } = useTheme();
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
      <div className="rounded-xl border border-error bg-error-soft p-4 shadow-sm">
        <div className="flex gap-3">
          <div className="shrink-0">
            <div className="rounded-lg bg-error/10 p-2">
              <XCircleIcon className="h-5 w-5 text-error" aria-hidden="true" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-error">{t('sitemap.generationFailed')}</h3>
            <p className="mt-1 text-sm text-error-foreground">{t('sitemap.generationError')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === SitemapStatus.Canceled) {
    return (
      <div className="rounded-xl border border-warning bg-warning-soft p-4 shadow-sm">
        <div className="flex gap-3">
          <div className="shrink-0">
            <div className="rounded-lg bg-warning/10 p-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-warning" aria-hidden="true" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-warning">
              {t('sitemap.generationCanceled')}
            </h3>
            <p className="mt-1 text-sm text-warning-foreground">
              {t('sitemap.generationCanceledMessage')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === SitemapStatus.Finished) {
    return (
      <div className="space-y-4">
        {result.result && Array.isArray(result.result) && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {t('sitemap.foundUrls', { count: result.result.length })}
            </span>
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              <button
                type="button"
                onClick={e => {
                  e.preventDefault();
                  setViewMode('json');
                }}
                disabled={isLoadingGraph || isLoadingMarkdown}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  viewMode === 'json'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CodeBracketIcon className="h-3.5 w-3.5" />
                <span>JSON</span>
              </button>
              <button
                type="button"
                onClick={e => {
                  e.preventDefault();
                  fetchSitemapGraph();
                }}
                disabled={isLoadingGraph || isLoadingMarkdown}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  viewMode === 'graph'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ChartBarIcon className="h-3.5 w-3.5" />
                <span>{isLoadingGraph ? t('common.loading') : 'Graph'}</span>
              </button>
              <button
                type="button"
                onClick={e => {
                  e.preventDefault();
                  fetchSitemapMarkdown();
                }}
                disabled={isLoadingGraph || isLoadingMarkdown}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  viewMode === 'markdown'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <DocumentTextIcon className="h-3.5 w-3.5" />
                <span>{isLoadingMarkdown ? t('common.loading') : 'Markdown'}</span>
              </button>
            </div>
          </div>
        )}

        {viewMode === 'json' && (
          <div className="ltr h-[600px] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={JSON.stringify(result.result, null, 2)}
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

        {viewMode === 'graph' && (
          <div className="ltr overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border/50 bg-muted/30 px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">{t('sitemap.structure')}</h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto p-4">
              <SitemapGraphViewer sitemapData={sitemapGraph} isLoading={isLoadingGraph} />
            </div>
            <div className="border-t border-border/50 bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
              <p>• {t('sitemap.tips.expandFolders')}</p>
              <p>• {t('sitemap.tips.clickLinks')}</p>
            </div>
          </div>
        )}

        {viewMode === 'markdown' && (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border/50 bg-muted/30 px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">{t('sitemap.markdown')}</h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
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
