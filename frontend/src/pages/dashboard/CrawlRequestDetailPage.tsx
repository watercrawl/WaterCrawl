import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '../../hooks/useDateLocale';
import { formatDistanceToNowLocalized } from '../../utils/dateUtils';
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
import { ChevronRight, ArrowRight, ArrowLeft } from '../../components/shared/DirectionalIcon';

const CrawlRequestDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
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
      { label: t('dashboard.navigation.dashboard'), href: '/dashboard' },
      { label: t('activityLogs.crawlLogs'), href: '/dashboard/logs/crawls' },
      {
        label: t('activityLogs.table.url'),
        href: `/dashboard/logs/crawls/${requestId}`,
        current: true,
      },
    ]);
  }, [setItems, requestId, t]);

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
        await crawlRequestApi.subscribeToStatus(requestId, handleCrawlEvent, () =>
          setLoading(false)
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
        toast.error(t('activityLogs.errors.fetchFailed'));
        navigate('/dashboard/logs');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId, navigate, t]);

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
        toast.error(t('crawl.messages.noResults'));
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [request, requestId, navigate, wasRunning, t]);

  const loadMore = async () => {
    if (!requestId || !results?.next || loadingMore) return;

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
      toast.error(t('crawl.messages.noResults'));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCancel = async () => {
    if (!request) return;

    try {
      await crawlRequestApi.cancelCrawl(request.uuid);
      toast.success(t('crawl.messages.cancelled'));
      setRequest(prev => (prev ? { ...prev, status: 'canceled' } : null));
    } catch (error) {
      console.error('Error canceling crawl:', error);
      toast.error(t('crawl.messages.cancelFailed'));
    }
  };

  const handleTryInCrawl = () => {
    if (!request) return;
    navigate('/dashboard/crawl', { state: { request } });
  };

  if (loading && !request) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-border"></div>
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-x-3">
            <button
              onClick={() => navigate('/dashboard/logs/crawls')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {t('crawl.results.details')}
              </h1>
              <p className="max-w-lg truncate text-sm text-muted-foreground">{request.url}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {request.status === 'running' && (
              <button
                onClick={handleCancel}
                className="inline-flex items-center rounded-md bg-error px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-error-strong focus:outline-none focus:ring-error focus:ring-offset-2"
              >
                <div className="flex items-center gap-x-2">
                  <span>{t('crawl.form.cancelCrawl')}</span>
                </div>
              </button>
            )}
            {request && <DownloadFormatSelector request={request} buttonWithText />}
            {request && <SitemapModalSelector request={request} buttonWithText />}
            <button
              onClick={handleTryInCrawl}
              className="inline-flex items-center rounded-md border border-primary bg-card px-3 py-1.5 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-primary/10 focus:outline-none focus:ring-primary focus:ring-offset-2"
            >
              <ArrowRight className="me-1.5 h-4 w-4" />
              {t('activityLogs.emptyState.goToCrawl')}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Right Column - Info Box (moves to top on mobile) */}
          <div className="order-1 lg:order-2 lg:col-span-1">
            <div className="rounded-lg border border-border bg-card shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-base font-medium text-foreground">{t('common.info')}</h2>
              </div>
              <div className="px-4 py-4">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('crawl.form.url')}
                    </dt>
                    <dd className="mt-1 break-all text-sm text-foreground">{request.url}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('activityLogs.table.status')}
                    </dt>
                    <dd className="mt-1">
                      <StatusBadge status={request.status} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('crawl.typeLabel')}
                    </dt>
                    <dd className="mt-1">
                      <CrawlTypeBadge type={request.crawl_type || 'single'} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('activityLogs.table.created')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {formatDistanceToNowLocalized(new Date(request.created_at), dateLocale, {
                        addSuffix: true,
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('activityLogs.table.duration')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {formatRequestDuration(request.duration)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('activityLogs.table.results')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {request.number_of_documents || 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('dashboard.settings.advanced')}
                    </dt>
                    <dd className="mt-1">
                      <button
                        onClick={() => setShowParameters(!showParameters)}
                        className="inline-flex items-center text-sm text-foreground"
                      >
                        <span className="me-1">{t('dashboard.actions.viewDetails')}</span>
                        {showParameters ? (
                          <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {showParameters && (
                        <div className="mt-2 space-y-2">
                          <div className="ltr rounded-md bg-muted p-3">
                            <pre className="whitespace-pre-wrap text-xs text-foreground">
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
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-base font-medium text-foreground">{t('crawl.form.results')}</h2>
              </div>
              <div className="p-4">
                {request?.status === 'running' && (
                  <div className="flex w-full items-center justify-center">
                    <AnimatedProcessing />
                  </div>
                )}
                {loading && !allResults.length ? (
                  <div className="flex flex-col items-center justify-center space-y-3 py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-border"></div>
                    <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {allResults.map(result => (
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
                          className="inline-flex items-center rounded-md border border-input-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                        >
                          {loadingMore ? (
                            <>
                              <div className="me-2 h-4 w-4 animate-spin rounded-full border-b-2 border-border"></div>
                              {t('common.loading')}
                            </>
                          ) : (
                            t('dashboard.actions.viewAll')
                          )}
                        </button>
                      ) : request.status !== 'running' && allResults && allResults.length > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {t('pagination.showing')} {allResults.length} {t('pagination.results')}
                        </p>
                      ) : null}
                      {request.status === 'running' && (
                        <p className="text-sm text-muted-foreground">{t('crawl.form.crawling')}</p>
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
