import React, { useCallback, useEffect, useState } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { LinkIcon, CalendarIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

import { ChevronRight } from '../../../components/shared/DirectionalIcon';
import { Pagination } from '../../../components/shared/Pagination';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useDateLocale } from '../../../hooks/useDateLocale';
import { activityLogsApi } from '../../../services/api/activityLogs';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { PaginatedResponse } from '../../../types/common';
import { CrawlRequest } from '../../../types/crawl';
import { KnowledgeBaseDetail } from '../../../types/knowledge';
import { formatDistanceToNowLocalized } from '../../../utils/dateUtils';

const SelectCrawlPage: React.FC = () => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const navigate = useNavigate();
  const [crawlData, setCrawlData] = useState<PaginatedResponse<CrawlRequest> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { setItems } = useBreadcrumbs();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDetail | null>(null);

  // Fetch crawl requests from the API
  const fetchCrawlRequests = useCallback(
    async (page: number) => {
      try {
        setIsLoading(true);
        // Only get finished crawls as we can only select from completed crawls
        const data = await activityLogsApi.listCrawlRequests(page, ['finished', 'canceled']);
        setCrawlData(data);
      } catch (error) {
        console.error('Failed to load crawl data:', error);
        toast.error(t('activityLogs.errors.fetchFailed'));
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (!knowledgeBaseId) return;
    knowledgeBaseApi
      .get(knowledgeBaseId as string)
      .then(response => {
        setKnowledgeBase(response);
      })
      .catch(() => {
        toast.error(t('settings.knowledgeBase.toast.loadError'));
        navigate('/dashboard/knowledge-base');
      });
  }, [knowledgeBaseId, navigate, t]);

  useEffect(() => {
    fetchCrawlRequests(currentPage);
  }, [currentPage, fetchCrawlRequests]);

  const handleCrawlSelect = (crawlId: string) => {
    if (crawlId) {
      // Navigate to the URL selector page
      navigate(`/dashboard/knowledge-base/${knowledgeBaseId}/import/select-crawl/${crawlId}`);
    }
  };

  useEffect(() => {
    if (!knowledgeBase) return;
    setItems([
      { label: t('dashboard.navigation.dashboard'), href: '/dashboard' },
      { label: t('knowledgeBase.list'), href: '/dashboard/knowledge-base' },
      { label: knowledgeBase.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}` },
      {
        label: t('knowledgeBase.import.title'),
        href: `/dashboard/knowledge-base/${knowledgeBaseId}/import`,
      },
      {
        label: t('knowledgeBase.import.selectCrawl'),
        href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-crawl`,
        current: true,
      },
    ]);
  }, [knowledgeBase, knowledgeBaseId, setItems, t]);

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/4 rounded bg-muted"></div>
          <div className="mb-8 h-4 w-1/2 rounded bg-muted"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded bg-muted"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">
          {t('knowledgeBase.import.selectCrawlTitle')}
        </h1>
        <p className="mt-2 text-sm text-foreground">
          {t('knowledgeBase.import.selectCrawlDescription')}
        </p>
      </div>

      <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="flex animate-pulse flex-col items-center">
              <div className="mb-4 h-6 w-1/4 rounded bg-muted"></div>
              <div className="h-4 w-1/2 rounded bg-muted"></div>
            </div>
          </div>
        ) : !crawlData || crawlData.results.length === 0 ? (
          <div className="bg-card py-12 text-center">
            <LinkIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">
              {t('knowledgeBase.import.noCrawls')}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('knowledgeBase.import.crawlFirst')}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pe-3 ps-4 text-start text-sm font-semibold text-foreground sm:ps-6"
                >
                  {t('common.url')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                >
                  {t('activityLogs.table.documents')}
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
                  <span className="sr-only">{t('common.select')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {crawlData.results.map(crawl => (
                <tr key={crawl.uuid} className="hover:bg-muted">
                  <td className="whitespace-nowrap py-4 pe-3 ps-4 text-sm font-medium text-foreground sm:ps-6">
                    <div className="flex items-center">
                      <LinkIcon className="me-3 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <div className="max-w-md truncate" title={crawl.url || ''}>
                        {crawl.url}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <DocumentTextIcon className="me-2 h-4 w-4 flex-shrink-0" />
                      {t('settings.knowledgeBase.selectCrawl.urlCount', {
                        count: crawl.number_of_documents,
                      })}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <CalendarIcon className="me-2 h-4 w-4 flex-shrink-0" />
                      {formatDistanceToNowLocalized(new Date(crawl.created_at), dateLocale, {
                        addSuffix: true,
                      })}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <ClockIcon className="me-2 h-4 w-4 flex-shrink-0" />
                      {crawl.duration}s
                    </div>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pe-4 ps-3 text-end text-sm font-medium sm:pe-6">
                    <button
                      type="button"
                      onClick={() => handleCrawlSelect(crawl.uuid)}
                      className="flex items-center text-primary hover:text-primary-strong"
                    >
                      {t('settings.knowledgeBase.selectCrawl.select')}
                      <ChevronRight className="ms-1 h-4 w-4" />
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

      <div className="mt-4 text-sm text-muted-foreground">
        <p>{t('knowledgeBase.import.selectCrawlHelp')}</p>
      </div>
    </div>
  );
};

export default SelectCrawlPage;
