import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SitemapRequest, SitemapStatus } from '../../types/sitemap';
import { DocumentChartBarIcon, CodeBracketSquareIcon } from '@heroicons/react/24/outline';
import SitemapGraphViewer from './SitemapGraphViewer';
import SitemapMarkdownViewer from './SitemapMarkdownViewer';
import { sitemapApi } from '../../services/api/sitemap';
import { SitemapGraph } from '../../types/crawl';
import toast from 'react-hot-toast';
import Button from '../shared/Button';

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
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{t('sitemap.noSitemapYet')}</p>
      </div>
    );
  }

  if (loading && result.status === SitemapStatus.Running) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary-500 border-e-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">{t('common.loading')}</span>
        </div>
        <span className="ms-2 text-gray-700 dark:text-gray-300">{t('sitemap.generatingSitemap')}</span>

      </div>
    );
  }

  if (result.status === SitemapStatus.Failed) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ms-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{t('sitemap.generationFailed')}</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-200">
              <p>{t('sitemap.generationError')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === SitemapStatus.Canceled) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ms-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">{t('sitemap.generationCanceled')}</h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
              <p>{t('sitemap.generationCanceledMessage')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === SitemapStatus.Finished) {
    return (
      <div className="space-y-6 ltr">
        {result.result && Array.isArray(result.result) && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
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
                <CodeBracketSquareIcon className="w-4 h-4" />
                JSON
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'graph' ? 'primary' : 'outline'}
                onClick={() => fetchSitemapGraph()}
                loading={isLoadingGraph}
                disabled={isLoadingGraph}
              >
                <DocumentChartBarIcon className="w-4 h-4" />
                Graph
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'markdown' ? 'primary' : 'outline'}
                onClick={() => fetchSitemapMarkdown()}
                loading={isLoadingMarkdown}
                disabled={isLoadingMarkdown}
              >
                <CodeBracketSquareIcon className="w-4 h-4" />
                Markdown
              </Button>
            </div>
          </div>
        )}

        {viewMode === 'json' && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('sitemap.urlList')}</h3>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-300 font-mono whitespace-pre-wrap break-all">
                {JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          </div>
        )}


        {viewMode === 'graph' && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('sitemap.structure')}</h3>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <SitemapGraphViewer
                sitemapData={sitemapGraph}
                isLoading={isLoadingGraph}
              />
            </div>
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              <p>• {t('sitemap.tips.expandFolders')}</p>
              <p>• {t('sitemap.tips.clickLinks')}</p>
            </div>
          </div>
        )}

        {viewMode === 'markdown' && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('sitemap.markdown')}</h3>
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
    <div className="text-center py-8">
      <p className="text-gray-500 dark:text-gray-400">
        {result.status === SitemapStatus.New ? t('sitemap.waitingToStart') : t('common.loading')}
      </p>
    </div>
  );
};
