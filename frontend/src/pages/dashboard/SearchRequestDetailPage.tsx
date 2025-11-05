import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { SearchResultDisplay } from '../../components/search/SearchResultDisplay';
import { SearchResult, SearchRequest, SearchEvent } from '../../types/search';
import { toast } from 'react-hot-toast';
import { formatDuration } from '../../utils/formatters';
import { format } from 'date-fns';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useDateLocale } from '../../hooks/useDateLocale';
import { formatDistanceToNowLocalized } from '../../utils/dateUtils';
import { searchApi } from '../../services/api/search';
import { AnimatedProcessing } from '../../components/shared/AnimatedProcessing';
import { CrawlStatus } from '../../types/crawl';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { ChevronRight, ArrowRight, ArrowLeft } from '../../components/shared/DirectionalIcon';

const SearchRequestDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchRequest, setSearchRequest] = useState<SearchRequest | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showParameters, setShowParameters] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { setItems } = useBreadcrumbs();
  useEffect(() => {
    setItems([
      { label: t('dashboard.navigation.dashboard'), href: '/dashboard' },
      { label: t('activityLogs.searchLogs'), href: '/dashboard/logs/searches' },
      { label: t('search.title'), href: `/dashboard/logs/searches/${id}`, current: true },
    ]);
  }, [setItems, id, t]);

  useEffect(() => {
    const fetchSearchRequest = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const result = await searchApi.get(id);
        setSearchRequest(result);
        if (result.result) {
          setResults(result.result as SearchResult[]);
        }
        if (result.status === 'running') {
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error('Error fetching search request:', error);
        toast.error(t('activityLogs.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchSearchRequest();
  }, [id, t]);

  useEffect(() => {
    const pollStatus = async () => {
      if (!id || !isSubscribed) return;

      try {
        await searchApi.subscribeToStatus(id, handleSearchEvent, () => setLoading(false));
      } catch (error) {
        console.error('Error polling status:', error);
        setIsSubscribed(false);
      }
    };

    pollStatus();
  }, [id, isSubscribed]);

  const handleSearchEvent = async (event: SearchEvent) => {
    if (event.type === 'state') {
      const newRequest = event.data as SearchRequest;
      setSearchRequest(newRequest);
      setResults((newRequest.result as SearchResult[]) || []);
      if (newRequest.status !== 'running') {
        setIsSubscribed(false);
      }
    }
  };

  const handleDownloadResults = async () => {
    if (!id) return;

    try {
      // Create a JSON file for download from the current results
      if (searchRequest?.result && Array.isArray(searchRequest.result)) {
        const jsonString = JSON.stringify(searchRequest.result, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `search_results_${id}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t('toasts.success.saved'));
      } else {
        toast.error(t('search.results.noResults'));
      }
    } catch (error) {
      console.error('Error downloading search results:', error);
      toast.error(t('toasts.error.load'));
    }
  };

  const handleTryInSearch = () => {
    if (searchRequest) {
      navigate('/dashboard/search', {
        state: {
          initialQuery: searchRequest.query,
          initialSearchOptions: searchRequest.search_options,
          initialNumResults: searchRequest.result_limit,
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

  if (!searchRequest) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="py-12 text-center">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">{t('errors.notFound')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('errors.unauthorized.message')}</p>
          <div className="mt-6">
            <Link
              to="/dashboard/logs/searches"
              className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <ArrowLeft className="me-2 h-4 w-4" />
              {t('activityLogs.searchLogs')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function handleCancel(): void {
    if (!searchRequest?.uuid) return;
    searchApi.delete(searchRequest.uuid);
  }

  return (
    <div className="min-h-screen">
      <div className="px-6 py-4">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-x-3">
            <button
              onClick={() => navigate('/dashboard/logs/searches')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{t('search.results.title')}</h1>
              <p className="max-w-lg truncate text-sm text-muted-foreground">
                {t('search.form.query')}: {searchRequest.query}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {searchRequest.status === 'running' && (
              <button
                onClick={handleCancel}
                className="inline-flex items-center rounded-md bg-error px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-error-strong focus:outline-none focus:ring-error focus:ring-offset-2"
              >
                <div className="flex items-center gap-x-2">
                  <span>{t('crawl.form.cancelCrawl')}</span>
                </div>
              </button>
            )}
            <button
              onClick={handleDownloadResults}
              className="inline-flex items-center rounded-md border border-input-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="me-1.5 h-4 w-4" />
              {t('dashboard.actions.export')}
            </button>
            <button
              onClick={handleTryInSearch}
              className="inline-flex items-center rounded-md border border-primary bg-card px-3 py-1.5 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-primary/10 focus:outline-none focus:ring-primary focus:ring-offset-2"
            >
              <ArrowRight className="me-1.5 h-4 w-4" />
              {t('search.title')}
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
                      <StatusBadge status={searchRequest.status as CrawlStatus} />
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('search.form.query')}
                    </dt>
                    <dd className="mt-1 break-words text-sm text-foreground">
                      {searchRequest.query}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('activityLogs.table.created')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {searchRequest.created_at ? (
                        <span title={format(new Date(searchRequest.created_at), 'PPpp')}>
                          {formatDistanceToNowLocalized(
                            new Date(searchRequest.created_at),
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
                      {formatDuration(searchRequest.duration || null, searchRequest.created_at)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('activityLogs.table.results')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {searchRequest.number_of_documents ??
                        (Array.isArray(searchRequest.result)
                          ? searchRequest.result.length
                          : 0)}{' '}
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
                                  search_options: searchRequest.search_options,
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
                  <SearchResultDisplay
                    results={results}
                    loading={searchRequest.status === 'running' || searchRequest.status === 'new'}
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

export default SearchRequestDetailPage;
