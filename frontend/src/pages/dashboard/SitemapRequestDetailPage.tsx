import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { formatDuration } from '../../utils/formatters';
import { format, formatDistanceToNow } from 'date-fns';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { sitemapApi } from '../../services/api/sitemap';
import { AnimatedProcessing } from '../../components/shared/AnimatedProcessing';
import { CrawlStatus } from '../../types/crawl';
import { SitemapEvent, SitemapRequest } from '../../types/sitemap';
import { SitemapResultDisplay } from '../../components/sitemap/SitemapResultDisplay';
import { SitemapDownloadFormatSelector } from '../../components/shared/SitemapDownloadFormatSelector';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

const SitemapRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sitemapRequest, setSitemapRequest] = useState<SitemapRequest | null>(null);
  const [showParameters, setShowParameters] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { setItems } = useBreadcrumbs();

  useEffect(() => {
    setItems([
      { label: 'Dashboard', href: '/dashboard'},
      { label: 'Sitemap Logs', href: '/dashboard/logs/sitemaps' },
      { label: 'Sitemap Request', href: `/dashboard/logs/sitemaps/${id}`, current: true },
    ]);
  }, [setItems, id]);

  useEffect(() => {
    const fetchSitemapRequest = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const result = await sitemapApi.get(id);
        setSitemapRequest(result);
        if (result.status === 'running') {
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error('Error fetching sitemap request:', error);
        toast.error('Failed to fetch sitemap request details.');
      } finally {
        setLoading(false);
      }
    };

    fetchSitemapRequest();
  }, [id]);

  useEffect(() => {
    const pollStatus = async () => {
      if (!id || !isSubscribed) return;

      try {
        await sitemapApi.subscribeToStatus(
          id,
          handleSitemapEvent,
          () => setLoading(false)
        );
      } catch (error) {
        console.error('Error polling status:', error);
        setIsSubscribed(false);
      }
    };

    pollStatus();

  }, [id, isSubscribed]);

  const handleSitemapEvent = async (event: SitemapEvent) => {
    if (event.type === 'state') {
      const newRequest = event.data as SitemapRequest;
      setSitemapRequest(newRequest);
      if (newRequest.status !== 'running') {
        setIsSubscribed(false);
      }
    }
  };


  const handleTryInSitemap = () => {
    if (sitemapRequest) {
      navigate('/dashboard/sitemap', {
        state: {
          request: sitemapRequest
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <AnimatedProcessing />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading sitemap details...</p>
        </div>
      </div>
    );
  }

  if (!sitemapRequest) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Sitemap request not found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The sitemap request you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <div className="mt-6">
            <Link
              to="/dashboard/logs/sitemaps"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Sitemap Logs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function handleCancel(): void {
    if (!sitemapRequest?.uuid) return;
    sitemapApi.delete(sitemapRequest.uuid);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/dashboard/logs/sitemaps')}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Sitemap Request Details</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-lg">Query: {sitemapRequest.url}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {sitemapRequest.status === 'running' && (
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-3 py-1.5 text-sm rounded-md shadow-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span>Cancel Crawling</span>
                </div>
              </button>
            )}
            <SitemapDownloadFormatSelector request={sitemapRequest} buttonWithText/>
            <button
              onClick={handleTryInSitemap}
              className="inline-flex items-center px-3 py-1.5 text-sm border border-primary-300 dark:border-primary-600 rounded-md shadow-sm font-medium text-primary-700 dark:text-primary-200 bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:outline-none focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              <ArrowRightIcon className="h-4 w-4 mr-1.5" />
              Try in Sitemap Playground
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Right Column - Details Box */}
          <div className="order-1 lg:order-2 lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-base font-medium text-gray-900 dark:text-white">Details</h2>
              </div>
              <div className="px-4 py-4">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                    <dd className="mt-1">
                      <StatusBadge status={sitemapRequest.status as CrawlStatus} />
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">URL</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white break-words">
                      {sitemapRequest.url}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {sitemapRequest.created_at ? (
                        <span title={format(new Date(sitemapRequest.created_at), 'PPpp')}>
                          {formatDistanceToNow(new Date(sitemapRequest.created_at), { addSuffix: true })}
                        </span>
                      ) : 'N/A'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formatDuration(sitemapRequest.duration || null, sitemapRequest.created_at)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Results</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {(Array.isArray(sitemapRequest.result) ? sitemapRequest.result.length : 0)} results
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Parameters</dt>
                    <dd className="mt-1">
                      <button
                        onClick={() => setShowParameters(!showParameters)}
                        className="inline-flex items-center text-sm text-gray-900 dark:text-white"
                      >
                        <span className="mr-1">View Parameters</span>
                        {showParameters ? (
                          <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4" />
                        )}
                      </button>
                      {showParameters && (
                        <div className="mt-2 space-y-2">
                          <div className="rounded-md bg-gray-50 dark:bg-gray-900 p-3">
                            <pre className="text-xs text-gray-900 dark:text-white whitespace-pre-wrap">
                              {JSON.stringify({
                                options: sitemapRequest.options,
                              }, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Left Column - Results Box */}
          <div className="order-2 lg:order-1 lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-base font-medium text-gray-900 dark:text-white">Results</h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <SitemapResultDisplay result={sitemapRequest} loading={sitemapRequest.status === 'running' || sitemapRequest.status === 'new'} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SitemapRequestDetailPage;
