import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { SitemapRequest, SitemapStatus, SitemapOptions, SitemapEvent } from '../../types/sitemap';
import { sitemapApi } from '../../services/api/sitemap';
import { FormInput } from '../shared/FormComponents';
import { AxiosError } from 'axios';
import { SitemapResultDisplay } from './SitemapResultDisplay';
import { SitemapApiDocumentation } from './SitemapApiDocumentation';
import Button from '../shared/Button';
import { SitemapOptionsForm } from '../forms/SitemapOptionsForm';
import { SitemapDownloadFormatSelector } from '../shared/SitemapDownloadFormatSelector';
import Feed from '../shared/Feed';
import { FeedMessage } from '../../types/feed';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface SitemapFormProps {
  initialRequest?: SitemapRequest | null;
  onSitemapEvent?: (event: SitemapEvent) => void;
  hideApiDocs?: boolean;
  hideResultsTab?: boolean;
}

export const SitemapForm: React.FC<SitemapFormProps> = ({
  initialRequest,
  onSitemapEvent,
  hideApiDocs = false,
  hideResultsTab = false
}) => {
  const [url, setUrl] = useState(initialRequest?.url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [currentRequest, setCurrentRequest] = useState<SitemapRequest | null>(null);
  const [sitemapResult, setSitemapResult] = useState<SitemapRequest | null>(null);
  const [feedMessages, setFeedMessages] = useState<FeedMessage[]>([]);

  // Sitemap options state
  const [sitemapOptions, setSitemapOptions] = useState<SitemapOptions>({
    include_subdomains: initialRequest?.options?.include_subdomains || true,
    ignore_sitemap_xml: initialRequest?.options?.ignore_sitemap_xml || false,
    search: initialRequest?.options?.search || null,
    include_paths: initialRequest?.options?.include_paths || [],
    exclude_paths: initialRequest?.options?.exclude_paths || []
  });

  const updateCurrentRequest = useCallback(() => {
    if (!url) return;
    const request = {
      url: url.trim(),
      options: sitemapOptions
    } as SitemapRequest;
    setCurrentRequest(request);
  }, [url, sitemapOptions]);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    if (!initialRequest || !initialRequest.url) return;

    setUrl(initialRequest.url);
    setSitemapOptions(initialRequest.options);
    setCurrentRequest(initialRequest);
  }, [initialRequest]);

  useEffect(() => {
    updateCurrentRequest();
  }, [url, sitemapOptions, updateCurrentRequest]);

  // Start a new sitemap request
  const handleSubmit = async (e: React.FormEvent) => {
    setFeedMessages([]);
    e.preventDefault();
    if (!currentRequest?.url) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    try {
      const sitemapRequest: SitemapRequest = {
        url: currentRequest?.url.trim(),
        options: currentRequest?.options
      };

      const response = await sitemapApi.create(sitemapRequest);

      // Change tab to results
      setSelectedTab(tabs.findIndex(tab => tab.name === 'Results'));

      // Start checking status
      if (response.uuid) {
        await sitemapApi.subscribeToStatus(
          response.uuid,
          handleSitemapEvent,
          () => setIsLoading(false)
        );
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || 'Failed to generate sitemap.');
      } else {
        toast.error('Failed to generate sitemap.');
      }
      console.error('Error generating sitemap:', error);
      setIsLoading(false);
    }
  };

  // Cancel a running sitemap request
  const handleCancel = async () => {
    if (sitemapResult?.uuid) {
      setIsLoading(true);
      try {
        await sitemapApi.delete(sitemapResult.uuid);
        toast.success('Sitemap generation canceled');
        // Refresh the sitemap state to show canceled
        const updatedRequest = await sitemapApi.get(sitemapResult.uuid);
        setSitemapResult(updatedRequest);
      } catch (error) {
        console.error('Error canceling sitemap generation:', error);
        toast.error('Failed to cancel sitemap generation.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle sitemap status update events
  const handleSitemapEvent = async (event: any) => {
    if (onSitemapEvent) {
      onSitemapEvent(event);
    }
    if (event.type === 'state') {
      const request = event.data;

      setSitemapResult(request);

      // If the sitemap is finished or failed, fetch results and stop checking
      if (request.status === SitemapStatus.Finished || request.status === SitemapStatus.Failed) {
        // Fetch the final results
        const finalRequest = await sitemapApi.get(request.uuid);
        setSitemapResult(finalRequest);
      }
    } else if (event.type === 'feed') {
      const feedMessage = event.data as FeedMessage;
      setFeedMessages(prev => [...prev, feedMessage]);
    }
  };

  // Define tabs structure similar to SearchForm
  const tabs = [
    {
      name: 'Sitemap Options',
      content: (
        <div>
          <SitemapOptionsForm
            options={sitemapOptions}
            onChange={(updatedOptions) => {
              setSitemapOptions({
                ...sitemapOptions,
                ...updatedOptions
              });
            }}
          />
          <div className="mt-3 space-y-2 bg-gray-50 dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Credit Usage & Speed:</p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  5 credits per sitemap
                  <span className="ml-1 text-xs text-green-600 dark:text-green-400">(Fastest speed)</span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">With Ignore Sitemap.xml:</span> 15 credits per sitemap
                  <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400">(Moderate speed)</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    ...(hideApiDocs ? [] : [
      {
        name: 'API Documentation',
        content: <SitemapApiDocumentation request={currentRequest} />,
      },
    ]),
    ...(hideResultsTab ? [] : [
      {
        name: 'Results',
        content: sitemapResult ? (
          <>
            <Feed messages={feedMessages} loading={isLoading} emptyMessage="No sitemap updates" showTimestamp={true} />
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      Sitemap for: {sitemapResult.url}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Status: {sitemapResult.status}
                      {sitemapResult.duration && ` • Duration: ${sitemapResult.duration}`}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {sitemapResult.status === SitemapStatus.Finished && (
                      <SitemapDownloadFormatSelector request={sitemapResult} buttonWithText />
                    )}
                  </div>
                </div>
                <SitemapResultDisplay
                  result={sitemapResult}
                  loading={isLoading}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No sitemap generated yet. Use the form to generate a sitemap.</p>
          </div>
        )
      }
    ])
  ];

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6">
      {/* Website URL Input and Generate Button */}
      <div className="space-y-2">
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 items-start">
          <div className="w-full">
            <FormInput
              label=""
              value={url}
              onChange={setUrl}
              type="text"
              placeholder="Enter a URL to generate sitemap (e.g. https://example.com)"
              className="w-full text-lg"
            />
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 hidden md:block">
              Enter a valid URL to explore its sitemap structure.
            </p>
          </div>
          <div className="w-full pt-1">
            {sitemapResult?.status === SitemapStatus.Running ? (
              <Button
                onClick={handleCancel}
                className="w-full md:w-auto px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Cancel Generation
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full md:w-auto px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Generating...' : 'Generate Sitemap'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab}>
        <div className="relative">
          <div className="overflow-x-auto scrollbar-hide">
            <TabList className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 min-w-max">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }: { selected: boolean }) =>
                    classNames(
                      'px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none',
                      selected
                        ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                      (tab.name === 'Results' && sitemapResult?.result)
                        ? 'text-primary-600 dark:text-primary-400'
                        : ''
                    )
                  }
                >
                  {tab.name}
                </Tab>
              ))}
            </TabList>
          </div>
        </div>
        <TabPanels className="mt-4">
          {tabs.map((tab, idx) => (
            <TabPanel
              key={idx}
            >
              {tab.content}
            </TabPanel>
          ))}
        </TabPanels>
      </TabGroup>
    </form>
  );
};
