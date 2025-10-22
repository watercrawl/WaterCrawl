import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { SitemapRequest } from '../../../types/sitemap';
import { sitemapApi } from '../../../services/api/sitemap';
import { PaginatedResponse } from '../../../types/common';
import toast from 'react-hot-toast';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useDateLocale } from '../../../hooks/useDateLocale';
import { formatDistanceToNowLocalized } from '../../../utils/dateUtils';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { KnowledgeBaseDetail } from '../../../types/knowledge';
import { Pagination } from '../../../components/shared/Pagination';
import { ChevronRight } from '../../../components/shared/DirectionalIcon';
import { useTranslation } from 'react-i18next';

const SelectSitemapPage: React.FC = () => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDetail | null>(null);
  const [sitemapData, setSitemapData] = useState<PaginatedResponse<SitemapRequest> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch sitemap requests from the API
  const fetchSitemapRequests = useCallback(
    async (page: number) => {
      try {
        setIsLoading(true);
        // Only get finished sitemaps
        const data = await sitemapApi.list(page, 'finished');
        setSitemapData(data);
      } catch (error) {
        console.error('Failed to load sitemap data:', error);
        toast.error(t('settings.knowledgeBase.selectSitemap.loadError'));
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    fetchSitemapRequests(currentPage);
  }, [currentPage, fetchSitemapRequests]);

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
    if (!knowledgeBase) return;
    setItems([
      { label: t('common.dashboard'), href: '/dashboard' },
      { label: t('settings.knowledgeBase.title'), href: '/dashboard/knowledge-base' },
      { label: knowledgeBase.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}` },
      {
        label: t('settings.knowledgeBase.import.title'),
        href: `/dashboard/knowledge-base/${knowledgeBaseId}/import`,
      },
      {
        label: t('settings.knowledgeBase.selectSitemap.title'),
        href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-sitemap`,
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
          {t('settings.knowledgeBase.selectSitemap.pageTitle')}
        </h1>
        <p className="mt-2 text-sm text-foreground">
          {t('settings.knowledgeBase.selectSitemap.pageSubtitle')}
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
        ) : !sitemapData || sitemapData.results.length === 0 ? (
          <div className="bg-card py-12 text-center">
            <MapIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">
              {t('settings.knowledgeBase.selectSitemap.noSitemaps')}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('settings.knowledgeBase.selectSitemap.generateFirst')}
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
                  {t('settings.knowledgeBase.selectSitemap.url')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                >
                  {t('settings.knowledgeBase.selectSitemap.created')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                >
                  {t('settings.knowledgeBase.selectSitemap.duration')}
                </th>
                <th scope="col" className="relative py-3.5 pe-4 ps-3 sm:pe-6">
                  <span className="sr-only">
                    {t('settings.knowledgeBase.selectSitemap.select')}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {sitemapData.results.map(sitemap => (
                <tr key={sitemap.uuid} className="hover:bg-muted">
                  <td className="whitespace-nowrap py-4 pe-3 ps-4 text-sm font-medium text-foreground sm:ps-6">
                    <div className="flex items-center">
                      <MapIcon className="me-3 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <div className="max-w-md truncate" title={sitemap.url}>
                        {sitemap.url}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                    {sitemap.created_at && (
                      <div className="flex items-center">
                        <CalendarIcon className="me-2 h-4 w-4 flex-shrink-0" />
                        {formatDistanceToNowLocalized(new Date(sitemap.created_at), dateLocale, {
                          addSuffix: true,
                        })}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                    {sitemap.duration && (
                      <div className="flex items-center">
                        <ClockIcon className="me-2 h-4 w-4 flex-shrink-0" />
                        {sitemap.duration}s
                      </div>
                    )}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pe-4 ps-3 text-end text-sm font-medium sm:pe-6">
                    <button
                      type="button"
                      onClick={() => handleSitemapSelect(sitemap.uuid as string)}
                      className="flex items-center text-primary hover:text-primary-900"
                    >
                      {t('settings.knowledgeBase.selectSitemap.select')}
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

      <div className="mt-4 text-sm text-muted-foreground">
        <p>{t('settings.knowledgeBase.selectSitemap.helpText')}</p>
      </div>
    </div>
  );
};

export default SelectSitemapPage;
