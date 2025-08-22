import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronRightIcon, 
  LinkIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { CrawlRequest } from '../../../types/crawl';
import { activityLogsApi } from '../../../services/api/activityLogs';
import { PaginatedResponse } from '../../../types/common';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { KnowledgeBaseDetail } from '../../../types/knowledge';
import { Pagination } from '../../../components/shared/Pagination';


const SelectCrawlPage: React.FC = () => {
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const navigate = useNavigate();
  const [crawlData, setCrawlData] = useState<PaginatedResponse<CrawlRequest> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { setItems } = useBreadcrumbs();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDetail | null>(null);

  // Fetch crawl requests from the API
  const fetchCrawlRequests = async (page: number) => {
    try {
      setIsLoading(true);
      // Only get finished crawls as we can only select from completed crawls
      const data = await activityLogsApi.listCrawlRequests(page, ['finished', 'canceled']);
      setCrawlData(data);
    } catch (error) {
      console.error('Failed to load crawl data:', error);
      toast.error('Failed to load crawl data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!knowledgeBaseId) return;
    knowledgeBaseApi.get(knowledgeBaseId as string).then((response) => {
      setKnowledgeBase(response);
    }).catch(() => {
      toast.error('Failed to load knowledge base');
      navigate('/dashboard/knowledge-base');
    });
  }, [knowledgeBaseId, navigate]);

  useEffect(() => {
    fetchCrawlRequests(currentPage);
  }, [currentPage]);

  const handleCrawlSelect = (crawlId: string) => {
    if (crawlId) {
      // Navigate to the URL selector page
      navigate(`/dashboard/knowledge-base/${knowledgeBaseId}/import/select-crawl/${crawlId}`);
    }
  };

  useEffect(() => {
    if (!knowledgeBase) return;
    setItems([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Knowledge Bases', href: '/dashboard/knowledge-base' },
      { label: knowledgeBase.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}`},
      { label: 'Import Options', href: `/dashboard/knowledge-base/${knowledgeBaseId}/import` },
      { label: 'Select Crawl Request', href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-crawl`, current: true },
    ]);
  }, [knowledgeBase, knowledgeBaseId, setItems]);

  if (isLoading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
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
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Select a Crawled Website
        </h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Choose a previously crawled website to import content from.
        </p>
      </div>

      <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ) : !crawlData || crawlData.results.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800">
            <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">
              No crawled websites available
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Please crawl a website first.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6"
                >
                  URL
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                >
                  Documents
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                >
                  Created
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200"
                >
                  Duration
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Select</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {crawlData.results.map((crawl) => (
                <tr key={crawl.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-200 sm:pl-6">
                    <div className="flex items-center">
                      <LinkIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="truncate max-w-md" title={crawl.url || ''}>
                        {crawl.url}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      {crawl.number_of_documents} URLs
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      {formatDistanceToNow(new Date(crawl.created_at), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      {crawl.duration}s
                    </div>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      type="button"
                      onClick={() => handleCrawlSelect(crawl.uuid)}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
                    >
                      Select
                      <ChevronRightIcon className="h-4 w-4 ml-1" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Pagination */}
      {crawlData && crawlData.count > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={crawlData.count}
          itemsPerPage={10}
          hasNextPage={!!crawlData.next}
          hasPreviousPage={!!crawlData.previous}
          onPageChange={setCurrentPage}
          loading={isLoading}
        />
      )}
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>
          Select one of your completed crawls to choose which URLs you want to add to your knowledge base.
        </p>
      </div>
    </div>
  );
};

export default SelectCrawlPage;
