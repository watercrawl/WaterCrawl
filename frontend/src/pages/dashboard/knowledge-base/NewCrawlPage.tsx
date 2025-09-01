import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CrawlForm } from '../../../components/crawl/CrawlForm';
import { CrawlEvent, CrawlRequest } from '../../../types/crawl';
import toast from 'react-hot-toast';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { KnowledgeBaseDetail } from '../../../types/knowledge';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';

const NewCrawlPage: React.FC = () => {
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
      const progress = Math.min((crawlRequest.number_of_documents / (crawlRequest.options.spider_options.page_limit || 1)) * 100, 100);
      setCrawlProgress(progress);
      
      // If crawl is complete, redirect to URL selector
      if (crawlRequest.status === 'finished') {
        toast.success('Crawl completed successfully!');
        setTimeout(() => {
          navigate(`/dashboard/knowledge-base/${knowledgeBaseId}/import/select-crawl/${crawlRequest.uuid}`);
        }, 1500);
      }
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
    if (!knowledgeBase) return;
    setItems([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Knowledge Bases', href: '/dashboard/knowledge-base' },
      { label: knowledgeBase.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}`},
      { label: 'Import Options', href: `/dashboard/knowledge-base/${knowledgeBaseId}/import`},
      { label: 'New Crawl', href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/new-crawl`, current: true },
    ]);
  }, [knowledgeBase, knowledgeBaseId, setItems]);

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Run New Crawl
        </h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Enter a URL to crawl and import into your knowledge base.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        {activeCrawl ? (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Crawling: {activeCrawl.url}</h4>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block text-primary-600 dark:text-primary-400">
                      {Math.round(crawlProgress)}% Complete
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-primary-600 dark:text-primary-400">
                      {activeCrawl.number_of_documents || 0} of {activeCrawl.options.spider_options.page_limit || '?'} pages
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded bg-primary-200 dark:bg-gray-700">
                  <div 
                    style={{ width: `${crawlProgress}%` }} 
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-600"
                  ></div>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Your crawl is in progress. You'll be redirected to select URLs when it completes.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Enter a URL to crawl and import into your knowledge base. After crawling, you'll be able to select which pages to import.
            </p>
            
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
