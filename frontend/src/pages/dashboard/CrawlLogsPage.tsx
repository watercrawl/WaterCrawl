import React, { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { EyeIcon } from '@heroicons/react/24/outline';

import { EmptyState } from '../../components/activity-logs/EmptyState';
import { CrawlRequestCard } from '../../components/shared/CrawlRequestCard';
import { DownloadFormatSelector } from '../../components/shared/DownloadFormatSelector';
import { Pagination } from '../../components/shared/Pagination';
import { SitemapModalSelector } from '../../components/shared/SitemapModalSelector';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useDateLocale } from '../../hooks/useDateLocale';
import { useIsTabletOrMobile } from '../../hooks/useMediaQuery';
import { activityLogsApi } from '../../services/api/activityLogs';
import { PaginatedResponse } from '../../types/common';
import { CrawlRequest } from '../../types/crawl';
import { formatDistanceToNowLocalized } from '../../utils/dateUtils';
import { formatDuration } from '../../utils/formatters';

const CrawlLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  // Status options for filtering
  const STATUS_OPTIONS = [
    { value: '', label: t('activityLogs.filters.allStatuses') },
    { value: 'new', label: t('status.new') },
    { value: 'running', label: t('status.running') },
    { value: 'finished', label: t('status.finished') },
    { value: 'canceled', label: t('status.canceled') },
    // { value: 'failed', label: t('status.failed') },
  ];
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [crawlRequests, setCrawlRequests] = useState<PaginatedResponse<CrawlRequest> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const { setItems } = useBreadcrumbs();

  const isTabletOrMobile = useIsTabletOrMobile();

  useEffect(() => {
    setItems([
      { label: t('dashboard.title'), href: '/dashboard' },
      { label: t('activityLogs.crawlLogs'), href: '/dashboard/logs/crawls', current: true },
    ]);
  }, [setItems, t]);

  // Initialize selectedStatus from URL params
  useEffect(() => {
    const statusParam = searchParams.get('status') || '';
    setSelectedStatus(statusParam);
  }, [searchParams]);

  const fetchCrawlRequests = async (page: number, status?: string) => {
    try {
      setLoading(true);
      const data = await activityLogsApi.listCrawlRequests(page, status);
      setCrawlRequests(data);
    } catch (error) {
      console.error('Error fetching crawl requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrawlRequests(currentPage, selectedStatus);
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

  const handleViewDetails = (e: React.MouseEvent, requestId: string) => {
    e.stopPropagation();
    navigate(`/dashboard/logs/crawls/${requestId}`);
  };

  if (loading && !crawlRequests) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-border"></div>
          <p className="text-sm text-muted-foreground">{t('activityLogs.loading')}</p>
        </div>
      </div>
    );
  }

  const hasNoData = !crawlRequests || crawlRequests.count === 0;

  return (
    <div className="h-full">
      <div className="px-4 py-6 sm:px-8">
        <h1 className="text-2xl font-semibold text-foreground">{t('activityLogs.crawlLogs')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('activityLogs.crawlLogsDesc')}</p>

        <div className="mt-8">
          {/* Status Filter - Positioned at the top */}
          <div className="mb-6">
            <label
              htmlFor="status-filter"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              {t('activityLogs.filters.filterByStatus')}
            </label>
            <div className="relative rounded-md shadow-sm">
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={handleStatusChange}
                className="block w-full rounded-md border border-input-border bg-input py-2 pe-10 ps-3 text-base text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-64 sm:text-sm"
                disabled={loading}
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasNoData ? (
            <EmptyState />
          ) : (
            <>
              {/* Loading overlay when filtering with existing data */}
              {loading && (
                <div className="absolute end-4 top-4 z-10 flex items-center justify-center">
                  <div className="flex items-center gap-x-2 rounded-md bg-card px-3 py-1 shadow-md">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
                    <span className="text-xs text-muted-foreground">
                      {t('activityLogs.updating')}
                    </span>
                  </div>
                </div>
              )}

              {/* Mobile and Tablet Card View */}
              {isTabletOrMobile ? (
                <div className={loading ? 'pointer-events-none opacity-70 transition-opacity' : ''}>
                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {crawlRequests?.results.map(request => (
                      <CrawlRequestCard key={request.uuid} request={request} />
                    ))}
                  </div>
                </div>
              ) : (
                /* Desktop Table View */
                <div className={loading ? 'pointer-events-none opacity-70 transition-opacity' : ''}>
                  <div className="mt-8 flex flex-col">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                      <div className="inline-block min-w-full px-4 py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden rounded-lg shadow ring-1 ring-black ring-opacity-5">
                          <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted">
                              <tr>
                                <th
                                  scope="col"
                                  className="py-3.5 pe-3 ps-4 text-start text-sm font-semibold text-foreground sm:ps-6"
                                >
                                  {t('activityLogs.table.url')}
                                </th>
                                <th
                                  scope="col"
                                  className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                                >
                                  {t('activityLogs.table.status')}
                                </th>
                                <th
                                  scope="col"
                                  className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                                >
                                  {t('activityLogs.table.results')}
                                </th>
                                <th
                                  scope="col"
                                  className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                                >
                                  {t('activityLogs.table.created')}
                                </th>
                                <th
                                  scope="col"
                                  className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                                >
                                  {t('activityLogs.table.duration')}
                                </th>
                                <th scope="col" className="relative py-3.5 pe-4 ps-3 sm:pe-6">
                                  <span className="sr-only">{t('common.actions')}</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                              {crawlRequests?.results.map(request => (
                                <React.Fragment key={request.uuid}>
                                  <tr className="transition-colors duration-200 hover:bg-muted">
                                    <td className="whitespace-nowrap py-4 pe-3 ps-4 text-sm font-medium text-foreground sm:ps-6">
                                      <div className="flex items-center">
                                        <span
                                          className="max-w-[300px] truncate"
                                          title={request.url || ''}
                                        >
                                          {request.url}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                      <StatusBadge status={request.status} />
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                      {request.number_of_documents}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                      {formatDistanceToNowLocalized(
                                        new Date(request.created_at),
                                        dateLocale,
                                        { addSuffix: true }
                                      )}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                      {formatDuration(request.duration, request.created_at)}
                                    </td>
                                    <td className="whitespace-nowrap py-4 pe-4 ps-3 text-end text-sm font-medium sm:pe-6">
                                      <div className="flex justify-end gap-x-3">
                                        <DownloadFormatSelector request={request} />
                                        <SitemapModalSelector request={request} />
                                        <button
                                          onClick={e => handleViewDetails(e, request.uuid)}
                                          className="text-muted-foreground hover:text-muted-foreground focus:outline-none"
                                          title={t('activityLogs.viewDetails')}
                                        >
                                          <span className="sr-only">
                                            {t('activityLogs.viewDetails')}
                                          </span>
                                          <EyeIcon className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pagination - Same for all views */}
              {crawlRequests && crawlRequests.count > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={crawlRequests.count}
                  hasNextPage={!!crawlRequests.next}
                  hasPreviousPage={!!crawlRequests.previous}
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

export default CrawlLogsPage;
