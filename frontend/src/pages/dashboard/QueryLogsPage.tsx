import React, { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import PageHeader from '../../components/shared/PageHeader';
import { Pagination } from '../../components/shared/Pagination';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useDateLocale } from '../../hooks/useDateLocale';
import { useIsTabletOrMobile } from '../../hooks/useMediaQuery';
import { knowledgeBaseApi } from '../../services/api/knowledgeBase';
import { PaginatedResponse } from '../../types/common';
import { KnowledgeBaseQuery, QueryStatus } from '../../types/knowledge';
import { formatDistanceToNowLocalized } from '../../utils/dateUtils';

const QueryLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const STATUS_OPTIONS = [
    { value: '', label: t('activityLogs.filters.allStatuses') },
    { value: QueryStatus.New, label: t('status.new') },
    { value: QueryStatus.Processing, label: t('status.processing') },
    { value: QueryStatus.Finished, label: t('status.finished') },
    { value: QueryStatus.Failed, label: t('status.failed') },
  ];

  const [searchParams, setSearchParams] = useSearchParams();
  const [queries, setQueries] = useState<PaginatedResponse<KnowledgeBaseQuery> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const { setItems } = useBreadcrumbs();

  const isTabletOrMobile = useIsTabletOrMobile();

  useEffect(() => {
    setItems([
      { label: t('dashboard.title'), href: '/dashboard' },
      { label: t('knowledgeBase.queryLogs'), href: '/dashboard/logs/queries', current: true },
    ]);
  }, [setItems, t]);

  useEffect(() => {
    const statusParam = searchParams.get('status') || '';
    setSelectedStatus(statusParam);
  }, [searchParams]);

  const fetchQueries = async (page: number, status?: string) => {
    try {
      setLoading(true);
      const data = await knowledgeBaseApi.listQueries(
        undefined,
        page,
        20,
        status as QueryStatus
      );
      setQueries(data);
    } catch (error) {
      console.error('Error fetching queries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries(currentPage, selectedStatus);
  }, [currentPage, selectedStatus]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setSelectedStatus(newStatus);
    setCurrentPage(1);

    const newParams = new URLSearchParams(searchParams);
    if (newStatus) {
      newParams.set('status', newStatus);
    } else {
      newParams.delete('status');
    }
    setSearchParams(newParams);
  };

  if (loading && !queries) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-border"></div>
          <p className="text-sm text-muted-foreground">{t('activityLogs.loading')}</p>
        </div>
      </div>
    );
  }

  const hasNoData = !queries || queries.count === 0;

  return (
    <div className="h-full">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <PageHeader
            titleKey="knowledgeBase.queryLogs"
            descriptionKey="knowledgeBase.queryLogsDesc"
            actions={
              <div className="flex items-center gap-3">
                <label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground">
                  {t('activityLogs.filters.status')}:
                </label>
                <select
                  id="status-filter"
                  value={selectedStatus}
                  onChange={handleStatusChange}
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
            <div className="py-12 text-center">
              <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">
                {t('knowledgeBase.noQueries')}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedStatus
                  ? t('knowledgeBase.noQueriesFiltered')
                  : t('knowledgeBase.noQueriesYet')}
              </p>
            </div>
          ) : (
            <>
              {loading && (
                <div className="mb-4 flex items-center justify-center gap-x-2 text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
                  <span className="text-xs text-muted-foreground">{t('common.loading')}</span>
                </div>
              )}

              {isTabletOrMobile ? (
                <div className={loading ? 'pointer-events-none opacity-70 transition-opacity' : ''}>
                  <div className="space-y-4">
                    {queries?.results.map(query => (
                      <div
                        key={query.uuid}
                        className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground line-clamp-2">
                              {query.query_text}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDistanceToNowLocalized(new Date(query.created_at), dateLocale)}{' '}
                              {t('common.ago')}
                            </p>
                          </div>
                          <StatusBadge status={query.status} />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              {t('knowledgeBase.resultsCount')}
                            </p>
                            <p className="mt-1 text-sm text-foreground">{query.results_count}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              {t('knowledgeBase.retrievalCost')}
                            </p>
                            <p className="mt-1 text-sm text-foreground">
                              {query.retrieval_cost}{' '}
                              {query.retrieval_cost === 1
                                ? t('settings.knowledgeBase.retrievalSettings.pricing.credit')
                                : t('settings.knowledgeBase.retrievalSettings.pricing.credits')}
                            </p>
                          </div>
                        </div>

                        {query.error_message && (
                          <div className="mt-3 rounded-md bg-destructive/10 p-2">
                            <p className="text-xs text-destructive">{query.error_message}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
                            {t('knowledgeBase.queryText')}
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
                            {t('knowledgeBase.resultsCount')}
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            {t('knowledgeBase.retrievalCost')}
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            {t('activityLogs.table.created')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50 bg-card">
                        {queries?.results.map(query => (
                          <tr
                            key={query.uuid}
                            className="transition-colors duration-150 hover:bg-muted/30"
                          >
                            <td className="py-3.5 pe-3 ps-6 text-sm text-foreground">
                              <div className="max-w-md">
                                <p className="line-clamp-2" title={query.query_text}>
                                  {query.query_text}
                                </p>
                                {query.error_message && (
                                  <p className="mt-1 text-xs text-destructive line-clamp-1">
                                    {query.error_message}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3.5 text-sm">
                              <StatusBadge status={query.status} />
                            </td>
                            <td className="whitespace-nowrap px-3 py-3.5 text-sm text-muted-foreground">
                              {query.results_count}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3.5 text-sm text-muted-foreground">
                              {query.retrieval_cost}{' '}
                              {query.retrieval_cost === 1
                                ? t('settings.knowledgeBase.retrievalSettings.pricing.credit')
                                : t('settings.knowledgeBase.retrievalSettings.pricing.credits')}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3.5 text-sm text-muted-foreground">
                              {formatDistanceToNowLocalized(new Date(query.created_at), dateLocale)}{' '}
                              {t('common.ago')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {queries && queries.count > 20 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={queries.count}
                    itemsPerPage={20}
                    hasNextPage={queries.next !== null}
                    hasPreviousPage={queries.previous !== null}
                    onPageChange={setCurrentPage}
                    loading={loading}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueryLogsPage;
