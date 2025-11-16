import React, { useState, useEffect, useCallback } from 'react';

import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { AxiosError } from 'axios';

import { SitemapOptionsForm } from '../forms/SitemapOptionsForm';
import Feed from '../shared/Feed';
import { FormInput } from '../shared/FormComponents';
import { SitemapDownloadFormatSelector } from '../shared/SitemapDownloadFormatSelector';
import { StatusBadge } from '../shared/StatusBadge';

import { useSettings } from '../../contexts/SettingsProvider';
import { sitemapApi } from '../../services/api/sitemap';
import { FeedMessage } from '../../types/feed';
import { SitemapRequest, SitemapStatus, SitemapOptions, SitemapEvent } from '../../types/sitemap';

import { SitemapApiDocumentation } from './SitemapApiDocumentation';
import { SitemapResultDisplay } from './SitemapResultDisplay';

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
  hideResultsTab = false,
}) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState(initialRequest?.url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [currentRequest, setCurrentRequest] = useState<SitemapRequest | null>(null);
  const [sitemapResult, setSitemapResult] = useState<SitemapRequest | null>(null);
  const [feedMessages, setFeedMessages] = useState<FeedMessage[]>([]);
  const { settings } = useSettings();

  // Sitemap options state
  const [sitemapOptions, setSitemapOptions] = useState<SitemapOptions>({
    include_subdomains: initialRequest?.options?.include_subdomains || true,
    ignore_sitemap_xml: initialRequest?.options?.ignore_sitemap_xml || false,
    search: initialRequest?.options?.search || null,
    include_paths: initialRequest?.options?.include_paths || [],
    exclude_paths: initialRequest?.options?.exclude_paths || [],
    proxy_server: initialRequest?.options?.proxy_server || null,
  });

  const updateCurrentRequest = useCallback(() => {
    if (!url) return;
    const request = {
      url: url.trim(),
      options: sitemapOptions,
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
      toast.error(t('sitemap.enterUrl'));
      return;
    }

    setIsLoading(true);
    try {
      const sitemapRequest: SitemapRequest = {
        url: currentRequest?.url.trim(),
        options: currentRequest?.options,
      };

      const response = await sitemapApi.create(sitemapRequest);

      // Change tab to results
      setSelectedTab(tabs.findIndex(tab => tab.name === 'Results'));

      // Start checking status
      if (response.uuid) {
        await sitemapApi.subscribeToStatus(response.uuid, handleSitemapEvent, () =>
          setIsLoading(false)
        );
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || 'Failed to generate sitemap.');
      } else {
        toast.error(t('sitemap.errors.generateFailed'));
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
        toast.success(t('sitemap.canceled'));
        // Refresh the sitemap state to show canceled
        const updatedRequest = await sitemapApi.get(sitemapResult.uuid);
        setSitemapResult(updatedRequest);
      } catch (error) {
        console.error('Error canceling sitemap generation:', error);
        toast.error(t('sitemap.errors.cancelFailed'));
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
      name: t('sitemap.tabs.options'),
      content: (
        <div>
          <SitemapOptionsForm
            options={sitemapOptions}
            onChange={updatedOptions => {
              setSitemapOptions({
                ...sitemapOptions,
                ...updatedOptions,
              });
            }}
          />
          {settings?.is_enterprise_mode_active && (
            <div className="mt-3 space-y-2 rounded-md border border-border bg-card p-3">
              <p className="text-xs font-medium text-foreground">
                {t('sitemap.creditUsage.title')}
              </p>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-x-2">
                  <div className="h-2 w-2 rounded-full bg-success"></div>
                  <p className="text-sm text-muted-foreground">
                    {t('sitemap.creditUsage.standard')}
                    <span className="ms-1 text-xs text-success">
                      ({t('sitemap.speed.fastest')})
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-x-2">
                  <div className="h-2 w-2 rounded-full bg-warning"></div>
                  <p className="text-sm text-muted-foreground">
                    <div className="inline font-medium">{t('sitemap.creditUsage.withIgnore')}:</div>{' '}
                    {t('sitemap.creditUsage.ignoreSitemapXml')}
                    <span className="ms-1 text-xs text-warning">
                      ({t('sitemap.speed.moderate')})
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    },
    ...(hideApiDocs
      ? []
      : [
          {
            name: t('sitemap.tabs.api'),
            content: <SitemapApiDocumentation request={currentRequest} />,
          },
        ]),
    ...(hideResultsTab
      ? []
      : [
          {
            name: t('sitemap.tabs.results'),
            content: sitemapResult ? (
              <>
                <Feed
                  messages={feedMessages}
                  loading={isLoading}
                  emptyMessage={t('sitemap.noUpdates')}
                  showTimestamp={true}
                />
                <div className="mt-4 rounded-lg bg-card p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-medium text-foreground">
                          {t('sitemap.sitemapFor')}: {sitemapResult.url}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {t('sitemap.status')}:{' '}
                          <StatusBadge status={sitemapResult.status as SitemapStatus} />
                          {sitemapResult.duration &&
                            ` • ${t('sitemap.duration')}: ${sitemapResult.duration}`}
                        </p>
                      </div>
                      <div className="flex gap-x-2">
                        {sitemapResult.status === SitemapStatus.Finished && (
                          <SitemapDownloadFormatSelector request={sitemapResult} buttonWithText />
                        )}
                      </div>
                    </div>
                    <SitemapResultDisplay result={sitemapResult} loading={isLoading} />
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">{t('sitemap.noSitemapYet')}</p>
              </div>
            ),
          },
        ]),
  ];

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        handleSubmit(e);
      }}
      className="space-y-6"
    >
      {/* Website URL Input and Generate Button */}
      <div className="space-y-2">
        <div className="flex flex-col items-start space-y-4 md:flex-row md:gap-x-4 md:space-y-0">
          <div className="w-full">
            <FormInput
              label=""
              value={url}
              onChange={setUrl}
              type="text"
              placeholder={t('sitemap.urlPlaceholder')}
              className="ltr w-full text-lg"
            />
            <p className="mt-1.5 hidden text-sm text-muted-foreground md:block">
              {t('sitemap.urlDescription')}
            </p>
          </div>
          <div className="w-full pt-1">
            {sitemapResult?.status === SitemapStatus.Running ? (
              <button
                type="button"
                onClick={handleCancel}
                className="w-full rounded-lg bg-error px-6 py-2.5 text-sm font-medium text-error-foreground transition-colors hover:bg-error-soft hover:text-error-strong focus:outline-none focus:ring-error focus:ring-offset-2 md:w-auto"
              >
                {t('sitemap.cancelGeneration')}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
              >
                {isLoading ? t('sitemap.generating') : t('sitemap.generateSitemap')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab}>
        <div className="relative">
          <div className="scrollbar-hide overflow-x-auto">
            <TabList className="flex min-w-max gap-x-1 border-b border-border">
              {tabs.map(tab => (
                <Tab
                  key={tab.name}
                  className={({ selected }: { selected: boolean }) =>
                    classNames(
                      'px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none',
                      selected
                        ? 'border-b-2 border-border text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                      tab.name === 'Results' && sitemapResult?.result ? 'text-primary' : ''
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
            <TabPanel key={idx}>{tab.content}</TabPanel>
          ))}
        </TabPanels>
      </TabGroup>
    </form>
  );
};
