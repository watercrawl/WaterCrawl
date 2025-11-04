import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CrawlForm } from '../../../components/crawl/CrawlForm';
import { CrawlEvent, CrawlRequest } from '../../../types/crawl';
import toast from 'react-hot-toast';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { KnowledgeBaseDetail } from '../../../types/knowledge';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';

const NewCrawlPage: React.FC = () => {
  const { t } = useTranslation();
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDetail | null>(null);

  // New crawl states
  const [activeCrawl, setActiveCrawl] = useState<CrawlRequest | null>(null);
  const [crawlProgress, setCrawlProgress] = useState(0);

  // Handle crawl events for progress tracking
  const handleCrawlEvent = (event: CrawlEvent) => {
    console.log('Crawl event received:', event);
    if (event.type === 'state' && event.data) {
      // Handle crawl state update
      const crawlRequest = event.data as CrawlRequest;

      // Update the UI with crawl progress
      setActiveCrawl(crawlRequest);

      // Use optional chaining with the extended properties
      const progress = Math.min(
        (crawlRequest.number_of_documents / (crawlRequest.options.spider_options.page_limit || 1)) *
          100,
        100
      );
      setCrawlProgress(progress);

      // If crawl is complete, redirect to URL selector
      if (crawlRequest.status === 'finished') {
        toast.success(t('crawl.messages.success'));
        setTimeout(() => {
          navigate(
            `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-crawl/${crawlRequest.uuid}`
          );
        }, 1500);
      }
    }
  };

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
        label: t('knowledgeBase.import.newCrawl'),
        href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/new-crawl`,
        current: true,
      },
    ]);
  }, [knowledgeBase, knowledgeBaseId, setItems, t]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">
          {t('knowledgeBase.import.newCrawl')}
        </h1>
        <p className="mt-2 text-sm text-foreground">{t('knowledgeBase.import.newCrawlDesc')}</p>
      </div>

      <div className="rounded-lg bg-card p-6 shadow">
        {activeCrawl ? (
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">
                {t('crawl.form.crawling')}: {activeCrawl.url}
              </h4>
              <div className="relative pt-1">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <span className="inline-block text-xs font-semibold text-primary">
                      {Math.round(crawlProgress)}% {t('dashboard.stats.successRate')}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="inline-block text-xs font-semibold text-primary">
                      {activeCrawl.number_of_documents || 0} of{' '}
                      {activeCrawl.options.spider_options.page_limit || '?'} pages
                    </span>
                  </div>
                </div>
                <div className="flex h-2 overflow-hidden rounded bg-primary/20 text-xs">
                  <div
                    style={{ width: `${crawlProgress}%` }}
                    className="flex flex-col justify-center whitespace-nowrap bg-primary text-center text-white shadow-none"
                  ></div>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t('crawl.status.crawling')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="mb-4 text-sm text-foreground">{t('knowledgeBase.import.newCrawlDesc')}</p>

            {/* Limited CrawlForm without API docs, Results tab, or Plugin tab */}
            <CrawlForm
              initialRequest={null}
              onCrawlEvent={handleCrawlEvent}
              hideApiDocs={true}
              hideResultsTab={true}
              hidePluginTab={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NewCrawlPage;
