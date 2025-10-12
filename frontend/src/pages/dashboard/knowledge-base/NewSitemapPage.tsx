import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SitemapForm } from '../../../components/sitemap/SitemapForm';
import { EventType, SitemapEvent, SitemapRequest, SitemapStatus } from '../../../types/sitemap';
import { FeedMessage } from '../../../types/feed';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import toast from 'react-hot-toast';
import { KnowledgeBaseDetail } from '../../../types/knowledge';
import { StatusBadge } from '../../../components/shared/StatusBadge';

const NewSitemapPage: React.FC = () => {
  const { t } = useTranslation();
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDetail | null>(null);
  const [activeSitemap, setActiveSitemap] = useState<SitemapRequest | null>(null);
  const [feed, setFeed] = useState<FeedMessage | null>(null);


  useEffect(() => {
    if (!knowledgeBaseId) {
      navigate('/dashboard/knowledge-base');
    }
    knowledgeBaseApi.get(knowledgeBaseId as string).then((response) => {
      setKnowledgeBase(response);
    }).catch(() => {
      toast.error(t('settings.knowledgeBase.toast.loadError'));
      navigate('/dashboard/knowledge-base');
    });
  }, [knowledgeBaseId, navigate, t]);

  useEffect(() => {
    if (!knowledgeBase) return;
    setItems([
      { label: t('dashboard.navigation.dashboard'), href: '/dashboard' },
      { label: t('knowledgeBase.list'), href: '/dashboard/knowledge-base' },
      { label: knowledgeBase.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}`},
      { label: t('knowledgeBase.import.title'), href: `/dashboard/knowledge-base/${knowledgeBaseId}/import`},
      { label: t('knowledgeBase.import.newSitemap'), href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/new-sitemap`, current: true },
    ]);
  }, [knowledgeBase, knowledgeBaseId, setItems, t]);

  const handleSitemapEvent = (event: SitemapEvent) => {

    if (event.type === EventType.State) {
      const request = event.data as SitemapRequest
      setActiveSitemap(request);
      if (request.status === SitemapStatus.Finished) {
        navigate(`/dashboard/knowledge-base/${knowledgeBaseId}/import/select-sitemap/${request.uuid}`);
        setActiveSitemap(null);
      }
    } else if (event.type === EventType.Feed) {
      const feed = event.data as FeedMessage
      setFeed(feed);
    }
  }


  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('knowledgeBase.import.newSitemap')}
        </h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          {t('knowledgeBase.import.newSitemapDesc')}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        {activeSitemap ? (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('sitemap.generating')}</h4>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block text-primary-600 dark:text-primary-400">
                      {t('activityLogs.table.status')}: <StatusBadge status={activeSitemap.status as SitemapStatus} />
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-10 text-xs flex rounded bg-primary-200 dark:bg-gray-700">
                  current: {feed?.message}
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {t('knowledgeBase.import.generatingProgress')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              {t('knowledgeBase.import.generatingInstructions')}
            </p>

            {/* Modified to capture the generated sitemap ID for redirection */}
            <SitemapForm onSitemapEvent={handleSitemapEvent} hideApiDocs={true} hideResultsTab={true} />

            {/* Add instructions for the user */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {t('knowledgeBase.import.generatingNote')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Modified script to be injected into the page to capture sitemap generation events
const SitemapCapture = () => {
  // This effect will inject a script to intercept the sitemap API calls
  useEffect(() => {
    // Store original fetch method for later restoration
    const originalFetch = window.fetch;

    // Create script element to capture XHR/Fetch API calls
    const script = document.createElement('script');
    script.id = 'sitemap-capture-script';
    script.innerHTML = `
      // Store original fetch method within the script
      const originalFetchScript = window.fetch;
      
      // Override fetch to intercept API calls
      window.fetch = async function(...args) {
        const response = await originalFetchScript.apply(this, args);
        const url = args[0];
        
        // Clone the response to read it without consuming it
        const responseClone = response.clone();
        
        try {
          // Check if this is a sitemap API response
          if (typeof url === 'string' && url.includes('/api/sitemap')) {
            responseClone.json().then(data => {
              // If this is a successful sitemap creation or status update
              if (data && data.uuid && data.status) {
                // Store the UUID for our component to find
                localStorage.setItem('lastSitemapUuid', data.uuid);
                console.log('Captured sitemap UUID:', data.uuid);
              }
            }).catch(err => {
              // Ignore JSON parsing errors
              console.log('Error parsing JSON in fetch interceptor:', err);
            });
          }
        } catch (error) {
          console.error('Error in fetch interceptor:', error);
        }
        
        // Return original response
        return response;
      };
    `;

    // Add script to document
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const scriptElement = document.getElementById('sitemap-capture-script');
      if (scriptElement) {
        document.head.removeChild(scriptElement);
      }
      // Restore original fetch on cleanup
      window.fetch = originalFetch;
    };
  }, []);

  return null; // This component doesn't render anything
};

const NewSitemapPageWithCapture = () => {
  return (
    <>
      <SitemapCapture />
      <NewSitemapPage />
    </>
  );
};

export default NewSitemapPageWithCapture;
