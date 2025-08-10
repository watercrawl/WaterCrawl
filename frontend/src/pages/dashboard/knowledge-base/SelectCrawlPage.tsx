import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronRightIcon, 
  LinkIcon
} from '@heroicons/react/24/outline';
import { CrawlRequest } from '../../../types/crawl';
import { activityLogsApi } from '../../../services/api/activityLogs';
import { PaginatedResponse } from '../../../types/common';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';


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

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        {!crawlData || crawlData.results.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400">
              No crawled websites available. Please crawl a website first.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {crawlData.results.map((crawl) => (
              <li key={crawl.uuid}>
                <button
                  type="button"
                  onClick={() => handleCrawlSelect(crawl.uuid)}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {crawl.url}
                      </p>
                      <div className="flex items-center mt-1">
                        <LinkIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {crawl.url}
                        </p>
                      </div>
                      <div className="flex space-x-4 mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(crawl.created_at), { addSuffix: true })}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {crawl.number_of_documents} URLs
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Duration: {crawl.duration}s
                        </p>
                      </div>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Pagination - separated from the list container */}
      {crawlData && crawlData.count > 0 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-center border-t border-gray-200 dark:border-gray-700 sm:px-6 mt-4 rounded-lg shadow">
          <nav className="flex items-center justify-between w-full max-w-md" aria-label="Pagination">
            <div className="flex-1 flex justify-start">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!crawlData.previous || isLoading}
                className="px-3 py-1 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
            </div>
            <div className="flex-1 flex justify-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {Math.ceil(crawlData.count / 10)}
              </span>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!crawlData.next || isLoading}
                className="px-3 py-1 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </nav>
        </div>
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
