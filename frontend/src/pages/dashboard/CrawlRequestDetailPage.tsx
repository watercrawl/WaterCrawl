import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { CrawlRequest, CrawlResult, CrawlEvent } from '../../types/crawl';
import { PaginatedResponse } from '../../types/common';
import { activityLogsApi } from '../../services/api/activityLogs';
import { crawlRequestApi } from '../../services/api/crawl';
import { CrawlResultCard } from '../../components/activity-logs/CrawlResultCard';
import CrawlResultModal from '../../components/ResultModal';
import { toast } from 'react-hot-toast';
import { AnimatedProcessing } from '../../components/shared/AnimatedProcessing';
import { formatDuration } from '../../utils/formatters';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { DownloadFormatSelector } from '../../components/shared/DownloadFormatSelector';
import { SitemapModalSelector } from '../../components/shared/SitemapModalSelector';
import { CrawlTypeBadge } from '../../components/crawl/CrawlTypeBadge';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

const CrawlRequestDetailPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<CrawlRequest | null>(null);
  const [results, setResults] = useState<PaginatedResponse<CrawlResult> | null>(null);
  const [allResults, setAllResults] = useState<CrawlResult[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedResult, setSelectedResult] = useState<CrawlResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showParameters, setShowParameters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [wasRunning, setWasRunning] = useState(false);
  const { setItems } = useBreadcrumbs();

  useEffect(() => {
    setItems([
      { label: 'Dashboard', href: '/dashboard'},
      { label: 'Crawl Logs', href: '/dashboard/logs/crawls' },
      { label: 'Crawl Request', href: `/dashboard/logs/crawls/${requestId}`, current: true },
    ]);
  }, [setItems, requestId]);

  const handleCrawlEvent = (event: CrawlEvent) => {
    if (event.type === 'state') {
      const newRequest = event.data as CrawlRequest;
      setRequest(newRequest);

      // If the request is no longer running, stop polling
      if (newRequest.status !== 'running') {
        setIsSubscribed(false);
      }
    } else if (event.type === 'result') {
      const newResult = event.data as CrawlResult;
      setAllResults(prev => {
        if (prev.some(result => result.uuid === newResult.uuid)) {
          return prev;
        }
        return [...prev, newResult];
      });
    }
  };

  // Set up polling for status updates
  useEffect(() => {
    const pollStatus = async () => {
      if (!requestId || !isSubscribed) return;

      try {
        await crawlRequestApi.subscribeToStatus(
          requestId,
          handleCrawlEvent,
          () => setLoading(false)
        );
      } catch (error) {
        console.error('Error polling status:', error);
        setIsSubscribed(false);
      }
    };

    pollStatus();

  }, [requestId, isSubscribed]);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!requestId) return;
      try {
        setLoading(true);
        const data = await activityLogsApi.getCrawlRequest(requestId);
        setRequest(data);

        // Subscribe to status updates if the request is still running
        if (data.status === 'running') {
          setIsSubscribed(true);
          setWasRunning(true);
        }
      } catch (error) {
        console.error('Error fetching crawl request:', error);
        toast.error('Failed to load crawl request');
        navigate('/dashboard/logs');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId, navigate]);

  useEffect(() => {
    if (!request || request.status === 'running' || wasRunning) return;
    const fetchResults = async () => {
      if (!request || request.status === 'running') return;
      try {
        setLoading(true);
        setCurrentPage(1);
        const data = await activityLogsApi.getCrawlResults(request.uuid, 1);
        setResults(data);
        setAllResults(data.results);
        setHasMore(!!data.next);
      } catch (error) {
        console.error('Error fetching crawl results:', error);
        toast.error('Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [request, requestId, navigate, wasRunning]);

  const loadMore = async () => {
    if (!requestId || !results?.next || loadingMore ) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const data = await activityLogsApi.getCrawlResults(requestId, nextPage);
      setResults(data);
      setAllResults(prev => [...prev, ...data.results]);
      setCurrentPage(nextPage);
      setHasMore(!!data.next);
    } catch (error) {
      console.error('Error loading more results:', error);
      toast.error('Failed to load more results');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCancel = async () => {
    if (!request) return;

    try {
      await crawlRequestApi.cancelCrawl(request.uuid);
      toast.success('Crawl canceled successfully');
      setRequest(prev => prev ? { ...prev, status: 'canceled' } : null);
    } catch (error) {
      console.error('Error canceling crawl:', error);
      toast.error('Failed to cancel crawl');
    }
  };

  const handleTryInCrawl = () => {
    if (!request) return;
    navigate('/dashboard/crawl', { state: { request } });
  };

  if (loading && !request) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return null;
  }

  function formatRequestDuration(duration: string | null) {
    if (request?.status === 'running') {
      return formatDuration(null, request.created_at);
    }
    return formatDuration(duration);
  }

  return (
    <div className="h-full">
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/dashboard/logs/crawls')}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Request Details</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-lg">{request.url}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {request.status === 'running' && (
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-3 py-1.5 text-sm rounded-md shadow-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span>Cancel Crawling</span>
                </div>
              </button>
            )}
            {request && <DownloadFormatSelector request={request} buttonWithText/>}
            {request && <SitemapModalSelector request={request} buttonWithText/>}
            <button
              onClick={handleTryInCrawl}
              className="inline-flex items-center px-3 py-1.5 text-sm border border-primary-300 dark:border-primary-600 rounded-md shadow-sm font-medium text-primary-700 dark:text-primary-200 bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:outline-none focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              <ArrowRightIcon className="h-4 w-4 mr-1.5" />
              Try in Crawl Playground
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Right Column - Info Box (moves to top on mobile) */}
          <div className="order-1 lg:order-2 lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-base font-medium text-gray-900 dark:text-white">Information</h2>
              </div>
              <div className="px-4 py-4">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Start URL</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white break-all">{request.url}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                    <dd className="mt-1">
                      <StatusBadge status={request.status} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Crawl Type</dt>
                    <dd className="mt-1">
                      <CrawlTypeBadge type={request.crawl_type || 'single'} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formatRequestDuration(request.duration)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Number of Results</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {request.number_of_documents || 0}
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
                              {JSON.stringify(request.options, null, 2)}
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

          {/* Left Column - Results Box (moves to bottom on mobile) */}
          <div className="order-2 lg:order-1 lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-base font-medium text-gray-900 dark:text-white">Results</h2>
              </div>
              <div className="p-4">
                {request?.status === 'running' && (
                  <div className="flex items-center justify-center w-full">
                    <AnimatedProcessing />
                  </div>
                )}
                {loading && !allResults.length ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Loading results...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allResults.map((result) => (
                        <CrawlResultCard
                          key={result.uuid}
                          result={result}
                          onPreviewClick={() => {
                            setSelectedResult(result);
                            setIsModalOpen(true);
                          }}
                        />
                      ))}
                    </div>
                    <div className="mt-4 flex justify-center">
                      {hasMore ? (
                        <button
                          onClick={loadMore}
                          disabled={loadingMore}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                          {loadingMore ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white mr-2"></div>
                              Loading...
                            </>
                          ) : (
                            'Load More'
                          )}
                        </button>
                      ) : request.status !== 'running' && allResults && allResults.length > 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          All {allResults.length} results loaded
                        </p>
                      ) : null}
                      {request.status === 'running' && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Crawling...
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {selectedResult && (
        <CrawlResultModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedResult(null);
          }}
          result={selectedResult}
        />
      )}
    </div>
  );
};

export default CrawlRequestDetailPage;
