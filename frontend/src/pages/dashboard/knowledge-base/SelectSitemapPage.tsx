import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronRightIcon, 
  MapIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { SitemapRequest } from '../../../types/sitemap';
import { sitemapApi } from '../../../services/api/sitemap';
import { PaginatedResponse } from '../../../types/common';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { KnowledgeBaseDetail } from '../../../types/knowledge';
import { Pagination } from '../../../components/shared/Pagination';

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

      <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ) : !sitemapData || sitemapData.results.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800">
            <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">
              No sitemaps available
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Please generate a sitemap first.
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
              {sitemapData.results.map((sitemap) => (
                <tr key={sitemap.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-200 sm:pl-6">
                    <div className="flex items-center">
                      <MapIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="truncate max-w-md" title={sitemap.url}>
                        {sitemap.url}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {sitemap.created_at && (
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        {formatDistanceToNow(new Date(sitemap.created_at), { addSuffix: true })}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {sitemap.duration && (
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        {sitemap.duration}s
                      </div>
                    )}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      type="button"
                      onClick={() => handleSitemapSelect(sitemap.uuid as string)}
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
      {sitemapData && sitemapData.count > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={sitemapData.count}
          itemsPerPage={10}
          hasNextPage={!!sitemapData.next}
          hasPreviousPage={!!sitemapData.previous}
          onPageChange={setCurrentPage}
          loading={isLoading}
        />
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
