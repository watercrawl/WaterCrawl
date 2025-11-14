import React, { useState, useEffect, useCallback } from 'react';

import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { MagnifyingGlassIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

import PageHeader from '../../components/shared/PageHeader';
import { Pagination } from '../../components/shared/Pagination';
import { SearchRequestCard } from '../../components/shared/SearchRequestCard';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useDateLocale } from '../../hooks/useDateLocale';
import { useIsTabletOrMobile } from '../../hooks/useMediaQuery';
import { searchApi } from '../../services/api/search';
import { PaginatedResponse } from '../../types/common';
import { CrawlStatus } from '../../types/crawl';
import { SearchRequest, SearchStatus } from '../../types/search';
import { formatDistanceToNowLocalized } from '../../utils/dateUtils';
import { formatDuration } from '../../utils/formatters';

const SearchLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  // Status options for filtering
  const STATUS_OPTIONS = [
    { value: '', label: t('activityLogs.filters.allStatuses') },
    { value: 'new', label: t('status.new') },
    { value: 'running', label: t('status.running') },
    { value: 'finished', label: t('status.finished') },
    { value: 'canceled', label: t('status.canceled') },
  ];
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchRequests, setSearchRequests] = useState<PaginatedResponse<SearchRequest> | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const { setItems } = useBreadcrumbs();

  const isTabletOrMobile = useIsTabletOrMobile();

  useEffect(() => {
    setItems([
      { label: t('dashboard.title'), href: '/dashboard' },
      { label: t('activityLogs.searchLogs'), href: '/dashboard/logs/searches', current: true },
    ]);
  }, [setItems, t]);

  // Initialize selectedStatus from URL params
  useEffect(() => {
    const statusParam = searchParams.get('status') || '';
    setSelectedStatus(statusParam);
  }, [searchParams]);

  const fetchSearchRequests = useCallback(
    async (page: number, status?: string) => {
      try {
        setLoading(true);
        const data = await searchApi.list(page, status);
        setSearchRequests(data);
      } catch (error) {
        console.error('Error fetching search requests:', error);
        toast.error(t('activityLogs.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    fetchSearchRequests(currentPage, selectedStatus);
  }, [currentPage, selectedStatus, fetchSearchRequests]);

  if (loading && !searchRequests) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-border"></div>
          <p className="text-sm text-muted-foreground">{t('activityLogs.loading')}</p>
        </div>
      </div>
    );
  }

  const hasNoData = !searchRequests || searchRequests.count === 0;

  return (
    <div className="h-full">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <PageHeader
            titleKey="activityLogs.searchLogs"
            descriptionKey="activityLogs.searchLogsDesc"
            actions={
              <div className="flex items-center gap-3">
                <label
                  htmlFor="status-filter"
                  className="text-sm font-medium text-muted-foreground"
                >
                  {t('activityLogs.filters.filterByStatus')}:
                </label>
                <select
                  id="status-filter"
                  value={selectedStatus}
                  onChange={e => {
                    const status = e.target.value;
                    setSelectedStatus(status);
                    if (status) {
                      searchParams.set('status', status);
                    } else {
                      searchParams.delete('status');
                    }
                    setSearchParams(searchParams);
                    setCurrentPage(1);
                  }}
                  disabled={loading}
                  className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            }
          />
        </div>

        <div className="mt-6">
          {hasNoData ? (
            <div className="rounded-lg bg-card py-12 text-center shadow">
              <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">
                {t('activityLogs.noSearchRequestsFound')}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('activityLogs.tryChangingFilterOrCreateNewSearchRequest')}
              </p>
            </div>
          ) : (
            <>
              {isTabletOrMobile ? (
                <div className="space-y-4">
                  {searchRequests?.results.map(request => (
                    <SearchRequestCard key={request.uuid} request={request} />
                  ))}
                </div>
              ) : (
                <div className={loading ? 'pointer-events-none opacity-70 transition-opacity' : ''}>
                  <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/30">
                        <tr>
                          <th
                            scope="col"
                            className="py-3 pe-3 ps-6 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            {t('activityLogs.table.query')}
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            {t('activityLogs.table.status')}
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            {t('activityLogs.table.created')}
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            {t('activityLogs.table.duration')}
                          </th>
                          <th scope="col" className="relative py-3 pe-6 ps-3">
                            <span className="sr-only">{t('common.actions')}</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50 bg-card">
                        {searchRequests?.results.map(request => (
                          <tr
                            key={request.uuid}
                            className="transition-colors duration-150 hover:bg-muted/30"
                          >
                            <td className="max-w-[300px] py-3.5 pe-3 ps-6 text-sm font-medium text-foreground">
                              <div className="truncate" title={request.query}>
                                {request.query}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3.5 text-sm">
                              <StatusBadge status={request.status as CrawlStatus} />
                            </td>
                            <td className="whitespace-nowrap px-3 py-3.5 text-sm text-muted-foreground">
                              {request.created_at
                                ? formatDistanceToNowLocalized(
                                    new Date(request.created_at),
                                    dateLocale,
                                    { addSuffix: true }
                                  )
                                : t('common.unknown')}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3.5 text-sm text-muted-foreground">
                              {formatDuration(request.duration || null, request.created_at)}
                            </td>
                            <td className="whitespace-nowrap py-3.5 pe-6 ps-3 text-end text-sm">
                              <div className="flex justify-end gap-2">
                                {request.status === SearchStatus.Finished && (
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      const jsonString = JSON.stringify(request.result, null, 2);
                                      const blob = new Blob([jsonString], {
                                        type: 'application/json',
                                      });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `search_results_${request.uuid}.json`;
                                      a.click();
                                      URL.revokeObjectURL(url);
                                    }}
                                    className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                                    title={t('activityLogs.downloadResults')}
                                  >
                                    <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    navigate(`/dashboard/logs/searches/${request.uuid}`);
                                  }}
                                  className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                                  title={t('activityLogs.viewDetails')}
                                >
                                  <span className="sr-only">{t('activityLogs.viewDetails')}</span>
                                  <EyeIcon className="h-4 w-4" aria-hidden="true" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {searchRequests && searchRequests.count > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={searchRequests.count}
                  hasNextPage={!!searchRequests.next}
                  hasPreviousPage={!!searchRequests.previous}
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

export default SearchLogsPage;
