import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Pagination } from '../../components/shared/Pagination';
import { PaginatedResponse } from '../../types/common';
import { toast } from 'react-hot-toast';
import { sitemapApi } from '../../services/api/sitemap';
import { useIsTabletOrMobile } from '../../hooks/useMediaQuery';
import { formatDistanceToNow } from 'date-fns';
import { formatDuration } from '../../utils/formatters';
import { SitemapRequest, SitemapStatus } from '../../types/sitemap';
import { SitemapRequestCard, SitemapStatusBadge } from '../../components/shared/SitemapRequestCard';
import { SitemapDownloadFormatSelector } from '../../components/shared/SitemapDownloadFormatSelector';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

// Status options for filtering
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'running', label: 'Running' },
  { value: 'finished', label: 'Finished' },
  { value: 'canceled', label: 'Canceled' },
];

const SitemapLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sitemapRequests, setSitemapRequests] = useState<PaginatedResponse<SitemapRequest> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const isTabletOrMobile = useIsTabletOrMobile();

  const { setItems } = useBreadcrumbs();

  useEffect(() => {
    setItems([
      { label: 'Dashboard', href: '/dashboard'},
      { label: 'Sitemap Logs', href: '/dashboard/logs/sitemaps', current: true },
    ]);
  }, [setItems]);

  // Initialize selectedStatus from URL params
  useEffect(() => {
    const statusParam = searchParams.get('status') || '';
    setSelectedStatus(statusParam);
  }, [searchParams]);

  const fetchSitemapRequests = async (page: number, status?: string) => {
    try {
      setLoading(true);
      const data = await sitemapApi.list(page, status);
      setSitemapRequests(data);
    } catch (error) {
      console.error('Error fetching sitemap requests:', error);
      toast.error('Failed to fetch sitemap history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSitemapRequests(currentPage, selectedStatus);
  }, [currentPage, selectedStatus]);

  // Update URL when status filter changes
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value;
    setSelectedStatus(status);
    
    // Update the URL with the new status
    if (status) {
      searchParams.set('status', status);
    } else {
      searchParams.delete('status');
    }
    setSearchParams(searchParams);
    
    // Reset to first page when changing filter
    setCurrentPage(1);
  };

  if (loading && !sitemapRequests) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading activity logs...</p>
        </div>
      </div>
    );
  }

  const hasNoData = !sitemapRequests || sitemapRequests.count === 0;

  return (
    <div className="h-full">
      <div className="px-4 sm:px-8 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Sitemap History</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View your recent sitemap requests and their results
        </p>

        <div className="mt-8">
          {/* Status Filter - Positioned at the top */}
          <div className="mb-6">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Status
            </label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={handleStatusChange}
              className="mt-1 block w-full sm:w-48 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:text-white sm:text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {hasNoData ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 shadow rounded-lg">
              <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No sitemap requests found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try changing your filter or create a new sitemap request.
              </p>
            </div>
          ) : (
            <>
              {isTabletOrMobile ? (
                <div className="space-y-4">
                  {sitemapRequests?.results.map((request) => (
                    <SitemapRequestCard
                      key={request.uuid}
                      request={request}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              URL
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Created
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Duration
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                          {sitemapRequests?.results.map((request) => (
                            <tr key={request.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                                <div className="flex items-center">
                                  <span className="max-w-[300px] truncate" title={request.url}>
                                    {request.url}
                                  </span>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm">
                                <SitemapStatusBadge status={request.status} />
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                {request.created_at ? formatDistanceToNow(new Date(request.created_at), { addSuffix: true }) : 'Unknown'}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                {formatDuration(request.duration || null, request.created_at)}
                              </td>
                              <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <div className="flex justify-end space-x-3">
                                  {request.status === SitemapStatus.Finished && (
                                    <SitemapDownloadFormatSelector request={request} />
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/dashboard/logs/sitemaps/${request.uuid}`);
                                    }}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                                    title="View details"
                                  >
                                    <span className="sr-only">View details</span>
                                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {sitemapRequests && sitemapRequests.count > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={sitemapRequests.count}
                  hasNextPage={!!sitemapRequests.next}
                  hasPreviousPage={!!sitemapRequests.previous}
                  onPageChange={setCurrentPage}
                  loading={loading}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SitemapLogsPage;
