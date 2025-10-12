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
import Button from '../../../components/shared/Button';
import { useDateLocale } from '../../../hooks/useDateLocale';
import { formatDistanceToNowLocalized } from '../../../utils/dateUtils';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { AxiosError } from 'axios';
import { Pagination } from '../../../components/shared/Pagination';
import { KnowledgeBaseDetail } from '../../../types/knowledge';
import { useTranslation } from 'react-i18next';

const RESULTS_PER_PAGE = 100;

const SelectCrawlResultsPage: React.FC = () => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
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
      { label: t('dashboard.navigation.dashboard'), href: '/dashboard' },
      { label: t('knowledgeBase.list'), href: '/dashboard/knowledge-base' },
      { label: knowledgeBase.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}` },
      { label: t('knowledgeBase.import.title'), href: `/dashboard/knowledge-base/${knowledgeBaseId}/import` },
      { label: t('knowledgeBase.import.selectCrawl'), href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-crawl` },
      { label: t('knowledgeBase.import.selectResults'), href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/${crawlRequestId}`, current: true },
    ]);
  }, [knowledgeBase, knowledgeBaseId, crawlRequestId, setItems, t]);


  useEffect(() => {
    if (!knowledgeBaseId) return;
    knowledgeBaseApi.get(knowledgeBaseId as string).then((response) => {
      setKnowledgeBase(response);
    }).catch(() => {
      toast.error(t('settings.knowledgeBase.toast.loadError'));
      navigate('/dashboard/knowledge-base');
    });
  }, [knowledgeBaseId, navigate, t]);

  // Load crawl request details
  useEffect(() => {
    const fetchCrawlRequest = async () => {
      if (!crawlRequestId) return;
      
      try {
        const data = await activityLogsApi.getCrawlRequest(crawlRequestId);
        setCrawlRequest(data);
      } catch (error) {
        console.error('Failed to load crawl request:', error);
        toast.error(t('activityLogs.errors.fetchFailed'));
        navigate(`/dashboard/knowledge-base/${knowledgeBaseId}/import/select-crawl`);
      }
    };

    fetchCrawlRequest();
  }, [crawlRequestId, knowledgeBaseId, navigate, t]);

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
      toast.error(t('activityLogs.errors.fetchFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [crawlRequestId, t]);

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

  // Import selected results
  const handleImportSelected = async () => {
    if (!knowledgeBaseId || !crawlRequestId) return;
    
    // Collect all selected UUIDs
    const selectedUuids = Array.from(allSelectedResults);
    
    if (selectedUuids.length === 0) {
      toast.error(t('knowledgeBase.import.noResultsSelected'));
      return;
    }
    
    setIsImporting(true);
    try {
      await knowledgeBaseApi.importFromCrawlResults(knowledgeBaseId, selectedUuids);
      
      toast.success(t('knowledgeBase.import.importSuccess', { count: selectedUuids.length }));
      navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Failed to import selected results:', error);
      
      if (axiosError.response?.status === 400) {
        toast.error(t('knowledgeBase.import.invalidRequest'));
      } else {
        toast.error(t('knowledgeBase.import.importFailed'));
      }
    } finally {
      setIsImporting(false);
    }
  };

  // Import all results from the crawl request
  const handleImportAll = async () => {
    if (!knowledgeBaseId || !crawlRequestId) {
      toast.error(t('knowledgeBase.import.missingIds'));
      return;
    }

    try {
      setIsImporting(true);
      
      await knowledgeBaseApi.importAllFromCrawlRequest(knowledgeBaseId, crawlRequestId);
      
      toast.success(t('knowledgeBase.import.importAllSuccess'));
      navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
    } catch (error) {
      if(error instanceof AxiosError){
        toast.error(error.response?.data?.message || t('knowledgeBase.import.importAllFailed'));
      }
      console.error('Failed to import all results:', error);
      toast.error(t('knowledgeBase.import.importAllFailed'));
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
              {t('knowledgeBase.import.selectResultsTitle')}
            </h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {crawlRequest ? (
                t('knowledgeBase.import.selectResultsDescription', { url: crawlRequest.url })
              ) : (
                t('common.loading')
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Selection summary and actions */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
        <div className="p-4 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('knowledgeBase.import.resultsSelected', { count: getTotalSelectedCount() })}
          </div>
          <div className="flex gap-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportAll}
              disabled={isImporting || !crawlRequestId}
              loading={isImporting}
              className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
            >
              {t('knowledgeBase.import.importAll')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleImportSelected}
              disabled={isImporting || getTotalSelectedCount() === 0}
              loading={isImporting}
            >
              <CheckIcon className="h-4 w-4 me-1" />
              {t('knowledgeBase.import.importSelected', { count: getTotalSelectedCount() })}
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
              {t('knowledgeBase.import.noResults')}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('knowledgeBase.import.noResultsDescription')}
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
                    className="absolute start-4 top-1/2 -mt-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-700"
                  />
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-gray-200"
                >
                  {t('common.url')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-gray-200"
                >
                  {t('activityLogs.table.created')}
                </th>
                <th scope="col" className="relative py-3.5 ps-3 pe-4 sm:pe-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchCrawlResults(currentPage)}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    <ArrowPathIcon className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  <span className="sr-only">{t('common.actions')}</span>
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
                      className="absolute start-4 top-1/2 -mt-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-700"
                      disabled={!result.uuid}
                    />
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <LinkIcon className="h-4 w-4 me-2 flex-shrink-0" />
                      <span className="truncate max-w-md" title={result.url}>{result.url}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 me-2 flex-shrink-0" />
                      {formatDistanceToNowLocalized(new Date(result.created_at), dateLocale, { addSuffix: true })}
                    </div>
                  </td>
                  <td className="relative whitespace-nowrap py-4 ps-3 pe-4 text-end text-sm font-medium sm:pe-6">
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
