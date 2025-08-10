import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  CheckIcon, 
  LinkIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { CrawlRequest, CrawlResult } from '../../../types/crawl';
import { activityLogsApi } from '../../../services/api/activityLogs';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { PaginatedResponse } from '../../../types/common';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import Button from '../../../components/shared/Button';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { AxiosError } from 'axios';

const RESULTS_PER_PAGE = 100;

const SelectCrawlResultsPage: React.FC = () => {
  const { knowledgeBaseId, crawlRequestId } = useParams<{ knowledgeBaseId: string, crawlRequestId: string }>();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDetail | null>(null);

  // States for crawl data
  const [crawlRequest, setCrawlRequest] = useState<CrawlRequest | null>(null);
  const [resultsData, setResultsData] = useState<PaginatedResponse<CrawlResult> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  
  // State for selection
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [persistedSelections, setPersistedSelections] = useState<{[page: number]: Set<string>}>({});
  const [selectAllOnPage, setSelectAllOnPage] = useState(false);

  useEffect(() => {
    if(!knowledgeBase) return;
    setItems([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Knowledge Bases', href: '/dashboard/knowledge-base' },
      { label: knowledgeBase.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}` },
      { label: 'Import Options', href: `/dashboard/knowledge-base/${knowledgeBaseId}/import` },
      { label: 'Select Crawl Request', href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-crawl` },
      { label: 'Select Crawl Results', href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/${crawlRequestId}`, current: true },
    ]);
  }, [knowledgeBase, knowledgeBaseId, crawlRequestId, setItems]);


  useEffect(() => {
    if (!knowledgeBaseId) return;
    knowledgeBaseApi.get(knowledgeBaseId as string).then((response) => {
      setKnowledgeBase(response);
    }).catch(() => {
      toast.error('Failed to load knowledge base');
      navigate('/dashboard/knowledge-base');
    });
  }, [knowledgeBaseId, navigate]);

  // Load crawl request details
  useEffect(() => {
    const fetchCrawlRequest = async () => {
      if (!crawlRequestId) return;
      
      try {
        const data = await activityLogsApi.getCrawlRequest(crawlRequestId);
        setCrawlRequest(data);
      } catch (error) {
        console.error('Failed to load crawl request:', error);
        toast.error('Failed to load crawl request');
        navigate(`/dashboard/knowledge-base/${knowledgeBaseId}/import/select-crawl`);
      }
    };

    fetchCrawlRequest();
  }, [crawlRequestId, knowledgeBaseId, navigate]);

  // Fetch paginated crawl results
  const fetchCrawlResults = useCallback(async (page: number) => {
    if (!crawlRequestId) return;
    
    try {
      setIsLoading(true);
      const data = await activityLogsApi.getCrawlResults(
        crawlRequestId, 
        page, 
        RESULTS_PER_PAGE, 
        true
      );
      setResultsData(data);
      
      // Reset select all checkbox when page changes
      setSelectAllOnPage(false);
    } catch (error) {
      console.error('Failed to load crawl results:', error);
      toast.error('Failed to load crawl results');
    } finally {
      setIsLoading(false);
    }
  }, [crawlRequestId]);

  // When page changes, fetch new data and restore any persisted selections
  useEffect(() => {
    fetchCrawlResults(currentPage);
    
    // When changing pages, restore any previously selected items on this page
    if (persistedSelections[currentPage]) {
      setSelectedResults(persistedSelections[currentPage]);
    } else {
      setSelectedResults(new Set());
    }
  }, [currentPage, fetchCrawlResults, persistedSelections]);

  // Handle toggling individual result selection
  const toggleResultSelection = (resultId: string) => {
    setSelectedResults(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(resultId)) {
        newSelection.delete(resultId);
      } else {
        newSelection.add(resultId);
      }
      
      // Persist selections for the current page
      setPersistedSelections(prevState => ({
        ...prevState,
        [currentPage]: newSelection
      }));
      
      return newSelection;
    });
  };

  // Handle select all on current page
  const handleSelectAllOnPage = () => {
    if (!resultsData?.results) return;
    
    const newSelectAll = !selectAllOnPage;
    setSelectAllOnPage(newSelectAll);
    
    if (newSelectAll) {
      // Select all items on current page
      const newSelection = new Set<string>();
      resultsData.results.forEach(result => {
        if (result.uuid) {
          newSelection.add(result.uuid);
        }
      });
      setSelectedResults(newSelection);
      
      // Persist selections for the current page
      setPersistedSelections(prevState => ({
        ...prevState,
        [currentPage]: newSelection
      }));
    } else {
      // Deselect all items on current page
      setSelectedResults(new Set());
      
      // Remove persisted selections for this page
      setPersistedSelections(prevState => {
        const newState = { ...prevState };
        delete newState[currentPage];
        return newState;
      });
    }
  };

  // Function to get total selected count across all pages
  const getTotalSelectedCount = () => {
    return Object.values(persistedSelections).reduce(
      (total, selections) => total + selections.size,
      0
    );
  };
  
  // Get selected count as formatted string with commas for thousands
  const getFormattedSelectedCount = () => {
    const count = getTotalSelectedCount();
    return count.toLocaleString();
  };

  // Import selected results
  const handleImportSelected = async () => {
    const totalSelected = getTotalSelectedCount();
    if (totalSelected === 0) {
      toast.error('Please select at least one result to import');
      return;
    }

    if (!knowledgeBaseId) {
      toast.error('Knowledge base ID is missing');
      return;
    }

    try {
      setIsImporting(true);
      
      // Flatten all selected UUIDs across pages into a single array
      const allSelectedUuids: string[] = [];
      Object.values(persistedSelections).forEach(selections => {
        selections.forEach(uuid => {
          allSelectedUuids.push(uuid);
        });
      });

      await knowledgeBaseApi.importFromCrawlResults(knowledgeBaseId, allSelectedUuids);
      
      toast.success(`Successfully imported ${totalSelected} results`);
      navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
    } catch (error) {
      if(error instanceof AxiosError){
        toast.error(error?.response?.data?.message || 'Failed to import selected results');
      } else {
        console.error('Failed to import selected results:', error);
        toast.error('Failed to import selected results');
      }
    } finally {
      setIsImporting(false);
    }
  };

  // Import all results from the crawl request
  const handleImportAll = async () => {
    if (!knowledgeBaseId || !crawlRequestId) {
      toast.error('Required IDs are missing');
      return;
    }

    try {
      setIsImporting(true);
      
      await knowledgeBaseApi.importAllFromCrawlRequest(knowledgeBaseId, crawlRequestId);
      
      toast.success('Successfully imported all results');
      navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
    } catch (error) {
      if(error instanceof AxiosError){
        toast.error(error.response?.data?.message || 'Failed to import all results');
      }
      console.error('Failed to import all results:', error);
      toast.error('Failed to import all results');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle navigation
  const handleGoBack = () => {
    navigate(`/dashboard/knowledge-base/${knowledgeBaseId}/import/select-crawl`);
  };

  if (isLoading && !resultsData) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Select Results to Import
            </h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {crawlRequest ? (
                <>
                  Choose which results from <span className="font-medium">{crawlRequest.url}</span> you want to import into your knowledge base
                </>
              ) : (
                'Loading crawl request information...'
              )}
            </p>
          </div>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoBack}
              className="mr-2"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Selection summary and actions */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
        <div className="p-4 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            <span className="font-bold">{getTotalSelectedCount()}</span> results selected across all pages
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportAll}
              disabled={isImporting || !crawlRequestId}
              loading={isImporting}
              className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
            >
              Import All Results
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleImportSelected}
              disabled={isImporting || getTotalSelectedCount() === 0}
              loading={isImporting}
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Import Selected ({getFormattedSelectedCount()})
            </Button>
          </div>
        </div>
      </div>

      {/* Results list */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden mb-6">
        <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
          <div className="p-4 flex items-center">
            <div className="flex-shrink-0 w-8">
              <input
                type="checkbox"
                checked={selectAllOnPage}
                onChange={handleSelectAllOnPage}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-700"
              />
            </div>
            <div className="flex-1 font-medium text-sm text-gray-700 dark:text-gray-300">
              Select all on this page
            </div>
            <div className="flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCrawlResults(currentPage)}
                disabled={isLoading}
              >
                <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {!resultsData || resultsData.results.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              No results found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This crawl request doesn't have any results.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {resultsData.results.map((result) => (
              <div key={result.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div
                  id={`result-${result.uuid}`}
                  className={`flex items-center p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedResults.has(result.uuid || '') ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className="flex-shrink-0 w-8">
                    <input
                      type="checkbox"
                      checked={selectedResults.has(result.uuid || '')}
                      onChange={() => result.uuid && toggleResultSelection(result.uuid)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-700"
                      disabled={!result.uuid}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {result.title || result.url}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-4">
                        <div className="flex items-center">
                          <LinkIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{result.url}</span>
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
                          <span>
                            {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {resultsData && resultsData.count > 0 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border border-gray-200 dark:border-gray-700 sm:px-6 rounded-lg">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{(currentPage - 1) * RESULTS_PER_PAGE + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * RESULTS_PER_PAGE, resultsData.count)}
                </span>{' '}
                of <span className="font-medium">{resultsData.count}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                  disabled={!resultsData.previous || isLoading}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>

                {/* Page number display */}
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:outline-offset-0">
                  {currentPage} / {Math.ceil(resultsData.count / RESULTS_PER_PAGE)}
                </span>

                <button
                  onClick={() => setCurrentPage(page => page + 1)}
                  disabled={!resultsData.next || isLoading}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>

          {/* Mobile pagination */}
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
              disabled={!resultsData.previous || isLoading}
              className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(page => page + 1)}
              disabled={!resultsData.next || isLoading}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectCrawlResultsPage;
