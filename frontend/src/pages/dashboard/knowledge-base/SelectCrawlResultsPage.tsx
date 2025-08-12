import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  CheckIcon, 
  LinkIcon,
  DocumentTextIcon,
  CalendarIcon,
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
import { Pagination } from '../../../components/shared/Pagination';
import { KnowledgeBaseDetail } from '../../../types/knowledge';

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
  
  // State for selection - maintain all selections across pages
  const [allSelectedResults, setAllSelectedResults] = useState<Set<string>>(new Set());

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
    } catch (error) {
      console.error('Failed to load crawl results:', error);
      toast.error('Failed to load crawl results');
    } finally {
      setIsLoading(false);
    }
  }, [crawlRequestId]);

  // When page changes, fetch new data 
  useEffect(() => {
    fetchCrawlResults(currentPage);
  }, [currentPage, fetchCrawlResults]);

  // Handle toggling individual result selection
  const toggleResultSelection = (resultId: string) => {
    setAllSelectedResults(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(resultId)) {
        newSelection.delete(resultId);
      } else {
        newSelection.add(resultId);
      }
      return newSelection;
    });
  };

  // Handle select all on current page
  const handleSelectAllOnPage = () => {
    if (!resultsData?.results) return;
    
    const currentPageResultIds = resultsData.results
      .filter(result => result.uuid)
      .map(result => result.uuid!);
    
    // Check if all current page items are selected
    const allCurrentPageSelected = currentPageResultIds.every(id => allSelectedResults.has(id));
    
    setAllSelectedResults(prev => {
      const newSelection = new Set(prev);
      
      if (allCurrentPageSelected) {
        // Deselect all items on current page
        currentPageResultIds.forEach(id => newSelection.delete(id));
      } else {
        // Select all items on current page
        currentPageResultIds.forEach(id => newSelection.add(id));
      }
      
      return newSelection;
    });
  };

  // Function to get total selected count across all pages
  const getTotalSelectedCount = () => {
    return allSelectedResults.size;
  };

  // Get selected count as formatted string with commas for thousands
  const getFormattedSelectedCount = () => {
    const count = getTotalSelectedCount();
    return count.toLocaleString();
  };

  // Import selected results
  const handleImportSelected = async () => {
    if (!knowledgeBaseId || !crawlRequestId) return;
    
    // Collect all selected UUIDs
    const selectedUuids = Array.from(allSelectedResults);
    
    if (selectedUuids.length === 0) {
      toast.error('No results selected');
      return;
    }
    
    setIsImporting(true);
    try {
      await knowledgeBaseApi.importFromCrawlResults(knowledgeBaseId, selectedUuids);
      
      toast.success(`Successfully imported ${selectedUuids.length} result(s)`);
      navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Failed to import selected results:', error);
      
      if (axiosError.response?.status === 400) {
        toast.error('Invalid request. Please check your selections and try again.');
      } else {
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

      {/* Results table */}
      <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ) : !resultsData || resultsData.results.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">
              No results found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This crawl request doesn't have any results.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                  <input
                    type="checkbox"
                    checked={resultsData.results.some(r => r.uuid) ? resultsData.results.filter(r => r.uuid).every(r => allSelectedResults.has(r.uuid!)) : false}
                    onChange={handleSelectAllOnPage}
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-700"
                  />
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                >
                  URL
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                >
                  Created
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchCrawlResults(currentPage)}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    <ArrowPathIcon className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {resultsData.results.map((result) => (
                <tr
                  key={result.uuid}
                  className={allSelectedResults.has(result.uuid || '') ? 'bg-blue-50 dark:bg-blue-900/20' : undefined}
                >
                  <td className="relative px-7 sm:w-12 sm:px-6">
                    <input
                      type="checkbox"
                      checked={allSelectedResults.has(result.uuid || '')}
                      onChange={() => result.uuid && toggleResultSelection(result.uuid)}
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-700"
                      disabled={!result.uuid}
                    />
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate max-w-md" title={result.url}>{result.url}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    {/* Future: Add individual result actions here if needed */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {resultsData && resultsData.count > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={resultsData.count}
          itemsPerPage={RESULTS_PER_PAGE}
          hasNextPage={!!resultsData.next}
          hasPreviousPage={!!resultsData.previous}
          onPageChange={setCurrentPage}
          loading={isLoading}
        />
      )}
    </div>
  );
};

export default SelectCrawlResultsPage;
