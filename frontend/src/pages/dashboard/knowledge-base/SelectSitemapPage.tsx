import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronRightIcon, 
  MapIcon
} from '@heroicons/react/24/outline';
import { SitemapRequest } from '../../../types/sitemap';
import { sitemapApi } from '../../../services/api/sitemap';
import { PaginatedResponse } from '../../../types/common';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { KnowledgeBaseDetail } from '../../../types/knowledge';

const SelectSitemapPage: React.FC = () => {
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDetail | null>(null);
  const [sitemapData, setSitemapData] = useState<PaginatedResponse<SitemapRequest> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch sitemap requests from the API
  const fetchSitemapRequests = async (page: number) => {
    try {
      setIsLoading(true);
      // Only get finished sitemaps
      const data = await sitemapApi.list(page, 'finished');
      setSitemapData(data);
    } catch (error) {
      console.error('Failed to load sitemap data:', error);
      toast.error('Failed to load sitemap data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSitemapRequests(currentPage);
  }, [currentPage]);

  const handleSitemapSelect = (sitemapId: string) => {
    if (sitemapId && knowledgeBaseId) {
      // Navigate to the URL selector page for this sitemap
      navigate(`/dashboard/knowledge-base/${knowledgeBaseId}/import/select-sitemap/${sitemapId}`);
    }
  };

  useEffect(() => {
    if (!knowledgeBaseId) {
      navigate('/dashboard/knowledge-base');
    }
    knowledgeBaseApi.get(knowledgeBaseId as string).then((response) => {
      setKnowledgeBase(response);
    }).catch(() => {
      toast.error('Failed to load knowledge base');
      navigate('/dashboard/knowledge-base');
    });
  }, [knowledgeBaseId, navigate]);

  useEffect(() => {
    if (!knowledgeBase) return;
    setItems([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Knowledge Bases', href: '/dashboard/knowledge-base' },
      { label: knowledgeBase.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}`},
      { label: 'Import Options', href: `/dashboard/knowledge-base/${knowledgeBaseId}/import`},
      { label: 'Select Sitemap', href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-sitemap`, current: true },
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
          Select a Sitemap
        </h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Choose a previously generated sitemap to import content from.
        </p>
      </div>

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        {!sitemapData || sitemapData.results.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400">
              No sitemaps available. Please generate a sitemap first.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {sitemapData.results.map((sitemap) => (
              <li key={sitemap.uuid}>
                <button
                  type="button"
                  onClick={() => handleSitemapSelect(sitemap.uuid as string)}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {sitemap.url}
                      </p>
                      <div className="flex items-center mt-1">
                        <MapIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {sitemap.url}
                        </p>
                      </div>
                      <div className="flex space-x-4 mt-2">
                        {sitemap.created_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(sitemap.created_at), { addSuffix: true })}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          From {sitemap.url}
                        </p>
                        {sitemap.duration && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Duration: {sitemap.duration}s
                          </p>
                        )}
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
      {sitemapData && sitemapData.count > 0 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-center border-t border-gray-200 dark:border-gray-700 sm:px-6 mt-4 rounded-lg shadow">
          <nav className="flex items-center justify-between w-full max-w-md" aria-label="Pagination">
            <div className="flex-1 flex justify-start">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!sitemapData.previous || isLoading}
                className="px-3 py-1 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
            </div>
            <div className="flex-1 flex justify-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {Math.ceil(sitemapData.count / 10)}
              </span>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!sitemapData.next || isLoading}
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
          Select one of your generated sitemaps to choose which URLs you want to add to your knowledge base.
        </p>
      </div>
    </div>
  );
};

export default SelectSitemapPage;
