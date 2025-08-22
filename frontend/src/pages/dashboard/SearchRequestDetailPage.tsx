import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { SearchResultDisplay } from '../../components/search/SearchResultDisplay';
import { SearchResult, SearchRequest, SearchEvent } from '../../types/search';
import { toast } from 'react-hot-toast';
import { formatDuration } from '../../utils/formatters';
import { format, formatDistanceToNow } from 'date-fns';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { searchApi } from '../../services/api/search';
import { AnimatedProcessing } from '../../components/shared/AnimatedProcessing';
import { CrawlStatus } from '../../types/crawl';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

const SearchRequestDetailPage: React.FC = () => {
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
      { label: 'Dashboard', href: '/dashboard'},
      { label: 'Search Logs', href: '/dashboard/logs/searches' },
      { label: 'Search Request', href: `/dashboard/logs/searches/${id}`, current: true },
    ]);
  }, [setItems, id]);

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
        toast.error('Failed to fetch search request details.');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchRequest();
  }, [id]);

  useEffect(() => {
    const pollStatus = async () => {
      if (!id || !isSubscribed) return;

      try {
        await searchApi.subscribeToStatus(
          id,
          handleSearchEvent,
          () => setLoading(false)
        );
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
      setResults(newRequest.result as SearchResult[] || []);
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
        toast.success('Search results downloaded successfully.');
      } else {
        toast.error('No results available to download');
      }
    } catch (error) {
      console.error('Error downloading search results:', error);
      toast.error('Failed to download search results.');
    }
  };

  const handleTryInSearch = () => {
    if (searchRequest) {
      navigate('/dashboard/search', {
        state: {
          initialQuery: searchRequest.query,
          initialSearchOptions: searchRequest.search_options,
          initialNumResults: searchRequest.result_limit
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <AnimatedProcessing />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading search details...</p>
        </div>
      </div>
    );
  }

  if (!searchRequest) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Search request not found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The search request you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <div className="mt-6">
            <Link
              to="/dashboard/logs/searches"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Search Logs
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/dashboard/logs/searches')}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Search Request Details</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-lg">Query: {searchRequest.query}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {searchRequest.status === 'running' && (
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-3 py-1.5 text-sm rounded-md shadow-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span>Cancel Crawling</span>
                </div>
              </button>
            )}
                <button
                  onClick={handleDownloadResults}
              className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 focus:outline-none focus:ring-offset-2 focus:ring-primary-500"
                >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                  Download Results
                </button>
            <button
              onClick={handleTryInSearch}
              className="inline-flex items-center px-3 py-1.5 text-sm border border-primary-300 dark:border-primary-600 rounded-md shadow-sm font-medium text-primary-700 dark:text-primary-200 bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:outline-none focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              <ArrowRightIcon className="h-4 w-4 mr-1.5" />
              Try in Search Playground
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
                      <StatusBadge status={searchRequest.status as CrawlStatus} />
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Query</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white break-words">
                      {searchRequest.query}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {searchRequest.created_at ? (
                        <span title={format(new Date(searchRequest.created_at), 'PPpp')}>
                          {formatDistanceToNow(new Date(searchRequest.created_at), { addSuffix: true })}
                        </span>
                      ) : 'N/A'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formatDuration(searchRequest.duration || null, searchRequest.created_at)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Results</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {searchRequest.number_of_documents ??
                        (Array.isArray(searchRequest.result) ? searchRequest.result.length : 0)} results
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
                                search_options: searchRequest.search_options,
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
                  <SearchResultDisplay results={results} loading={searchRequest.status === 'running' || searchRequest.status === 'new'}/>
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
