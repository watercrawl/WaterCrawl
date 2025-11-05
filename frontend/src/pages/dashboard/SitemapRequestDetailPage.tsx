import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { formatDuration } from '../../utils/formatters';
import { format } from 'date-fns';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useDateLocale } from '../../hooks/useDateLocale';
import { formatDistanceToNowLocalized } from '../../utils/dateUtils';
import { sitemapApi } from '../../services/api/sitemap';
import { AnimatedProcessing } from '../../components/shared/AnimatedProcessing';
import { CrawlStatus } from '../../types/crawl';
import { SitemapEvent, SitemapRequest } from '../../types/sitemap';
import { SitemapResultDisplay } from '../../components/sitemap/SitemapResultDisplay';
import { SitemapDownloadFormatSelector } from '../../components/shared/SitemapDownloadFormatSelector';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { ChevronRight, ArrowRight, ArrowLeft } from '../../components/shared/DirectionalIcon';

const SitemapRequestDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sitemapRequest, setSitemapRequest] = useState<SitemapRequest | null>(null);
  const [showParameters, setShowParameters] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { setItems } = useBreadcrumbs();

  useEffect(() => {
    setItems([
      { label: t('dashboard.navigation.dashboard'), href: '/dashboard' },
      { label: t('activityLogs.sitemapLogs'), href: '/dashboard/logs/sitemaps' },
      { label: t('sitemap.title'), href: `/dashboard/logs/sitemaps/${id}`, current: true },
    ]);
  }, [setItems, id, t]);

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
        toast.error(t('activityLogs.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchSitemapRequest();
  }, [id, t]);

  useEffect(() => {
    const pollStatus = async () => {
      if (!id || !isSubscribed) return;

      try {
        await sitemapApi.subscribeToStatus(id, handleSitemapEvent, () => setLoading(false));
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
          request: sitemapRequest,
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <AnimatedProcessing />
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!sitemapRequest) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="py-12 text-center">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">{t('errors.notFound')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('errors.unauthorized.message')}</p>
          <div className="mt-6">
            <Link
              to="/dashboard/logs/sitemaps"
              className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <ArrowLeft className="me-2 h-4 w-4" />
              {t('activityLogs.sitemapLogs')}
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
    <div className="min-h-screen">
      <div className="px-6 py-4">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-x-3">
            <button
              onClick={() => navigate('/dashboard/logs/sitemaps')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{t('sitemap.title')}</h1>
              <p className="max-w-lg truncate text-sm text-muted-foreground">
                {t('crawl.form.url')}: {sitemapRequest.url}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {sitemapRequest.status === 'running' && (
              <button
                onClick={handleCancel}
                className="inline-flex items-center rounded-md bg-error px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-error-strong focus:outline-none focus:ring-error focus:ring-offset-2"
              >
                <div className="flex items-center gap-x-2">
                  <span>{t('crawl.form.cancelCrawl')}</span>
                </div>
              </button>
            )}
            <SitemapDownloadFormatSelector request={sitemapRequest} buttonWithText />
            <button
              onClick={handleTryInSitemap}
              className="inline-flex items-center rounded-md border border-primary bg-card px-3 py-1.5 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-primary/10 focus:outline-none focus:ring-primary focus:ring-offset-2"
            >
              <ArrowRight className="me-1.5 h-4 w-4" />
              {t('sitemap.title')}
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Right Column - Details Box */}
          <div className="order-1 lg:order-2 lg:col-span-1">
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-base font-medium text-foreground">
                  {t('crawl.results.details')}
                </h2>
              </div>
              <div className="px-4 py-4">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('activityLogs.table.status')}
                    </dt>
                    <dd className="mt-1">
                      <StatusBadge status={sitemapRequest.status as CrawlStatus} />
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('crawl.form.url')}
                    </dt>
                    <dd className="mt-1 break-words text-sm text-foreground">
                      {sitemapRequest.url}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('activityLogs.table.created')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {sitemapRequest.created_at ? (
                        <span title={format(new Date(sitemapRequest.created_at), 'PPpp')}>
                          {formatDistanceToNowLocalized(
                            new Date(sitemapRequest.created_at),
                            dateLocale,
                            { addSuffix: true }
                          )}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('activityLogs.table.duration')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {formatDuration(sitemapRequest.duration || null, sitemapRequest.created_at)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('activityLogs.table.results')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {Array.isArray(sitemapRequest.result) ? sitemapRequest.result.length : 0}{' '}
                      {t('pagination.results')}
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
                              {JSON.stringify(
                                {
                                  options: sitemapRequest.options,
                                },
                                null,
                                2
                              )}
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
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-base font-medium text-foreground">{t('crawl.form.results')}</h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <SitemapResultDisplay
                    result={sitemapRequest}
                    loading={sitemapRequest.status === 'running' || sitemapRequest.status === 'new'}
                  />
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
