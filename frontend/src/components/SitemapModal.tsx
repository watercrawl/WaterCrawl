import React, { useEffect, useState, Fragment, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { XMarkIcon, DocumentArrowDownIcon, DocumentTextIcon, MapIcon } from '@heroicons/react/24/outline';
import { CrawlRequest, SitemapGraph } from '../types/crawl';
import { crawlRequestApi } from '../services/api/crawl';
import SitemapGraphViewer from './sitemap/SitemapGraphViewer';
import SitemapMarkdownViewer from './sitemap/SitemapMarkdownViewer';
import toast from 'react-hot-toast';

interface SitemapModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: CrawlRequest;
}

// Helper function for classNames
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const SitemapModal: React.FC<SitemapModalProps> = ({
  isOpen,
  onClose,
  request,
}) => {
  const { t } = useTranslation();
  const requestId = request.uuid;
  const [sitemapData, setSitemapData] = useState<SitemapGraph | null>(null);
  const [isLoadingSitemap, setIsLoadingSitemap] = useState(false);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoadingMarkdown, setIsLoadingMarkdown] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Load markdown content from API
  const loadMarkdownContent = useCallback(async () => {
    if (!requestId) return;

    try {
      setIsLoadingMarkdown(true);
      const markdown = await crawlRequestApi.sitmapMarkdown(requestId);
      setMarkdownContent(markdown);
    } catch (_error) {
      toast.error(t('sitemap.errors.loadMarkdown'));
      setMarkdownContent(t('sitemap.errors.loadMarkdownMessage'));
    } finally {
      setIsLoadingMarkdown(false);
    }
  }, [requestId, t]);

  const loadSitemap = useCallback(async () => {
    try {
      setIsLoadingSitemap(true);
      const data = await crawlRequestApi.sitmapGraph(request.uuid);
      setSitemapData(data);
    } catch (_error) {
      toast.error(t('sitemap.errors.loadSitemap'));
      setSitemapData(null);
    } finally {
      setIsLoadingSitemap(false);
    }
  }, [request.uuid, t]);

  useEffect(() => {
    // Reset state when modal is opened with new data
    if (isOpen && requestId) {
      // Load markdown content when opening the modal
      loadSitemap();
      loadMarkdownContent();
    }
  }, [isOpen, requestId, loadSitemap, loadMarkdownContent]);


  // Function to download the sitemap data
  const handleDownloadSitemap = (format: 'graph' | 'markdown') => {
    if (!sitemapData && format === 'graph') return;
    if (!markdownContent && format === 'markdown') return;


    try {
      let blob: Blob;
      let filename: string;

      if (format === 'graph') {
        // Create a JSON string from the data
        const jsonString = JSON.stringify(sitemapData, null, 2);
        blob = new Blob([jsonString], { type: 'application/json' });
        filename = `sitemap-${requestId}.json`;
      } else {
        // Create blob from markdown
        blob = new Blob([markdownContent], { type: 'text/markdown' });
        filename = `sitemap-${requestId}.md`;
      }

      // Create a URL for the blob
      const url = URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // Append the link to the document
      document.body.appendChild(link);

      // Trigger the download
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (_error) {
      toast.error(t('sitemap.errors.download'));
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 overflow-y-auto" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-start align-middle shadow-xl transition-all">
                <div className="absolute top-0 end-0 pt-4 pe-4">
                  <button
                    type="button"
                    className="bg-white dark:bg-gray-900 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Dialog.Title as="h3" className="text-xl leading-6 font-semibold text-gray-900 dark:text-white">
                      {t('sitemap.explorer')}
                    </Dialog.Title>

                    <div className="flex gap-x-2 me-6">
                      <button
                        onClick={() => request.sitemap && window.open(request.sitemap, '_blank')}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Open JSON Sitemap in new tab"
                        disabled={!request.sitemap}
                      >
                        <MapIcon className="h-4 w-4 me-1.5 text-blue-600 dark:text-blue-400" />
                        {t('sitemap.jsonSitemap')}
                      </button>

                      <div className="h-6 border-s border-gray-300 dark:border-gray-600 mx-1"></div>

                      <button
                        onClick={() => handleDownloadSitemap('graph')}
                        disabled={!sitemapData}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Download JSON Graph"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4 me-1.5 text-blue-600 dark:text-blue-400" />
                        {t('sitemap.jsonGraph')}
                      </button>

                      <button
                        onClick={() => handleDownloadSitemap('markdown')}
                        disabled={!markdownContent}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Download Markdown"
                      >
                        <DocumentTextIcon className="h-4 w-4 me-1.5 text-green-600 dark:text-green-400" />
                        {t('results.markdown')}
                      </button>
                    </div>
                  </div>

                  <Tab.Group selectedIndex={activeTabIndex} onChange={setActiveTabIndex}>
                    <Tab.List className="flex gap-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-4">
                      <Tab
                        className={({ selected }: { selected: boolean }) =>
                          classNames(
                            'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors',
                            'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white/60 ring-opacity-60',
                            selected
                              ? 'bg-white dark:bg-gray-700 shadow text-primary-700 dark:text-white'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-primary-700 dark:hover:text-white'
                          )
                        }
                      >
                        {t('sitemap.graphView')}
                      </Tab>
                      <Tab
                        className={({ selected }: { selected: boolean }) =>
                          classNames(
                            'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors',
                            'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white/60 ring-opacity-60',
                            selected
                              ? 'bg-white dark:bg-gray-700 shadow text-primary-700 dark:text-white'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-primary-700 dark:hover:text-white'
                          )
                        }
                      >
                        {t('sitemap.markdownView')}
                      </Tab>
                    </Tab.List>

                    <Tab.Panels>
                      <Tab.Panel className="rounded-xl focus:outline-none">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-[60vh] overflow-y-auto border border-gray-200 dark:border-gray-700 ltr">
                          <SitemapGraphViewer
                            sitemapData={sitemapData}
                            isLoading={isLoadingSitemap}
                          />
                        </div>
                      </Tab.Panel>
                      <Tab.Panel className="rounded-xl focus:outline-none">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-[60vh] overflow-y-auto border border-gray-200 dark:border-gray-700 ltr">
                          <SitemapMarkdownViewer
                            markdownContent={markdownContent}
                            isLoading={isLoadingMarkdown}
                          />
                        </div>
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>

                  <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700/50">
                    <h4 className="font-medium mb-1">{t('sitemap.tips.title')}</h4>
                    <p>• {t('sitemap.tips.expandFolders')}</p>
                    <p>• {t('sitemap.tips.openLinks')}</p>
                    <p>• {t('sitemap.tips.queryChips')}</p>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default SitemapModal;
