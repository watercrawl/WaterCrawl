import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Tab } from '@headlessui/react';
import { CrawlEvent, CrawlRequest, CrawlResult, CrawlState, PageOptions } from '../../types/crawl';
import { crawlRequestApi } from '../../services/api/crawl';
import { pluginsApi } from '../../services/api/plugins'; // Import pluginsService
import { PageOptionsForm } from '../forms/PageOptionsForm';
import { SpiderOptionsForm, SpiderOptions } from '../forms/SpiderOptionsForm';
import { ResultsTable } from '../ResultsTable';
import PluginOptionsForm from './PluginOptionsForm';
import { FormInput } from '../shared/FormComponents';
import { ApiDocumentation } from '../playground/ApiDocumentation';
import { JSONSchemaDefinition } from '../json-forms/types/schema';
import { AxiosError } from 'axios';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface CrawlFormProps {
  showSpiderOptions: boolean;
  initialRequest: CrawlRequest | null;
}

interface Error {
  [key: string]: string | string[] | Error;
}

export const CrawlForm: React.FC<CrawlFormProps> = ({ showSpiderOptions, initialRequest }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [currentRequest, setCurrentRequest] = useState<CrawlRequest | null>(null);
  const [formErrors, setFormErrors] = useState<{
    plugin?: boolean;
    errors?: Error
  }>({});
  const [pluginSchema, setPluginSchema] = useState<JSONSchemaDefinition | null>(null);

  const [pageOptions, setPageOptions] = useState<PageOptions>({
    exclude_tags: [],
    include_tags: [],
    wait_time: 1000,
    only_main_content: true,
    include_html: false,
    include_links: true,
    timeout: 15000,
    accept_cookies_selector: '',
    locale: '',
    extra_headers: {},
    actions: []
  });

  const [spiderOptions, setSpiderOptions] = useState<SpiderOptions>({
    maxDepth: '1',
    pageLimit: '1',
    allowedDomains: [],
    excludePaths: [],
    includePaths: [],
  });

  const [crawlStatus, setCrawlStatus] = useState<CrawlState>({
    request: null,
    results: [],
    isExpanded: true,
  });

  const [pluginOptions, setPluginOptions] = useState<Record<string, object>>({});

  // Initialize form state from currentRequest
  useEffect(() => {
    if (initialRequest && !url) {  // Only initialize if form is empty
      setUrl(initialRequest.url);
      if (initialRequest.options) {
        const { spider_options, page_options, plugin_options } = initialRequest.options;

        // Set spider options
        if (spider_options) {
          setSpiderOptions({
            maxDepth: spider_options.max_depth?.toString() || '1',
            pageLimit: spider_options.page_limit?.toString() || '1',
            allowedDomains: spider_options.allowed_domains || [],
            excludePaths: spider_options.exclude_paths || [],
            includePaths: spider_options.include_paths || [],
          });
        }

        // Set page options
        if (page_options) {
          setPageOptions({
            exclude_tags: page_options.exclude_tags || [],
            include_tags: page_options.include_tags || [],
            wait_time: page_options.wait_time || 1000,
            only_main_content: page_options.only_main_content ?? true,
            include_html: page_options.include_html ?? false,
            include_links: page_options.include_links ?? true,
            timeout: page_options.timeout || 15000,
            accept_cookies_selector: page_options.accept_cookies_selector || '',
            locale: page_options.locale || '',
            extra_headers: page_options.extra_headers || {},
            actions: page_options.actions || []
          });
        }

        // Set plugin options
        if (plugin_options) {
          setPluginOptions(plugin_options);
        }
      }
    }
  }, [initialRequest, url]);  // Add url to dependencies to prevent re-initialization

  // Add a shared function to filter active plugins
  const getActivePlugins = (plugins: Record<string, object>) => {
    return Object.entries(plugins).reduce((acc, [key, value]) => {
      if (value && typeof value === 'object' && 'is_active' in value && value.is_active) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, object>);
  };

  const updateRequest = useCallback(() => {
    if (!url) return;

    const request = {
      url,
      options: {
        spider_options: {
          max_depth: parseInt(spiderOptions.maxDepth),
          page_limit: parseInt(spiderOptions.pageLimit),
          allowed_domains: spiderOptions.allowedDomains,
          exclude_paths: spiderOptions.excludePaths,
          include_paths: spiderOptions.includePaths,
        },
        page_options: {
          exclude_tags: pageOptions.exclude_tags,
          include_tags: pageOptions.include_tags,
          wait_time: pageOptions.wait_time,
          only_main_content: pageOptions.only_main_content,
          include_html: pageOptions.include_html,
          include_links: pageOptions.include_links,
          timeout: pageOptions.timeout,
          accept_cookies_selector: pageOptions.accept_cookies_selector || undefined,
          locale: pageOptions.locale || undefined,
          extra_headers: pageOptions.extra_headers,
          actions: pageOptions.actions || []
        },
        plugin_options: getActivePlugins(pluginOptions)
      }
    } as CrawlRequest;

    setCurrentRequest(request);
  }, [url, pageOptions, spiderOptions, pluginOptions]);

  useEffect(() => {
    updateRequest();
  }, [url, pageOptions, spiderOptions, pluginOptions, updateRequest]);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const schemaData = await pluginsApi.getPluginSchema();
        setPluginSchema(schemaData);
      } catch (error) {
        console.error('Error fetching plugin schema:', error);
        toast.error('Failed to load plugin options');
      }
    };

    fetchSchema();
  }, []);

  const handlePageOptionsChange = (newOptions: Partial<PageOptions>) => {
    setPageOptions(prev => ({
      ...prev,
      ...newOptions
    }));
  };

  const handleSpiderOptionsChange = (newOptions: Partial<SpiderOptions>) => {
    setSpiderOptions(prev => ({
      ...prev,
      ...newOptions
    }));
  };

  const handlePluginOptionsChange = (formData: Record<string, object>) => {
    setPluginOptions(formData);
  };

  const handlePluginValidation = (hasErrors: boolean) => {
    setFormErrors(prev => ({ ...prev, plugin: hasErrors }));
  };

  const handleCrawlEvent = (event: CrawlEvent) => {
    if (event.type === 'state') {
      setCrawlStatus(prev => ({
        ...prev,
        request: event.data as CrawlRequest,
      }));
    } else if (event.type === 'result') {
      setCrawlStatus(prev => {
        if (prev.results.some(result => result.uuid === (event.data as CrawlResult).uuid)) {
          return prev;
        }

        return {
          ...prev,
          results: [...prev.results, event.data as CrawlResult],
        };
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    // Check for validation errors
    if (formErrors.plugin) {
      toast.error('Please fix the validation errors before submitting');
      // Switch to the plugin tab if there are errors
      setSelectedTab(tabs.findIndex(tab => tab.name === 'Plugin Options'));
      return;
    }

    setIsLoading(true);
    setCrawlStatus({ request: null, results: [], isExpanded: true });

    try {
      const response = await crawlRequestApi.createCrawlRequest(currentRequest as CrawlRequest);

      // Switch to Results tab
      setSelectedTab(tabs.findIndex(tab => tab.name === 'Results'));

      await crawlRequestApi.subscribeToStatus(
        response.uuid,
        handleCrawlEvent,
        () => setIsLoading(false)
      );


    } catch (error) {
      console.error('Error:', error);

      if (error instanceof AxiosError) {
        toast.error(error?.response?.data?.message);
        setFormErrors(prev => ({ ...prev, errors: error?.response?.data?.errors }));
      } else {
        toast.error('Failed to start crawling');
      }
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!crawlStatus.request?.uuid) return;

    try {
      await crawlRequestApi.cancelCrawl(crawlStatus.request.uuid);
      toast.success('Crawl cancelled successfully');
      setIsLoading(false);
      setCrawlStatus(prev => ({
        ...prev,
        request: { ...prev.request!, status: 'cancelled' } as CrawlRequest,
      }));
    } catch (error) {
      console.error('Error cancelling crawl:', error);
      toast.error('Failed to cancel crawl');
    }
  };

  const tabs = [
    ...(showSpiderOptions ? [{
      name: 'Spider Options',
      content: (
        <SpiderOptionsForm
          options={spiderOptions}
          onChange={handleSpiderOptionsChange}
        />
      )
    }] : []),
    {
      name: 'Page Options',
      content: (
        <PageOptionsForm
          options={pageOptions}
          onChange={handlePageOptionsChange}
        />
      )
    },
    {
      name: 'Plugin Options',
      content: (
        <PluginOptionsForm
          onChange={handlePluginOptionsChange}
          onValidation={handlePluginValidation}
          schema={pluginSchema}
          value={pluginOptions}
        />
      )
    },
    {
      name: 'API Documentation',
      content: <ApiDocumentation request={currentRequest} />
    },
    {
      name: 'Results',
      content: crawlStatus.request ? (
        <div ref={resultsRef}>
          <ResultsTable
            request={crawlStatus.request}
            results={crawlStatus.results}
            isExpanded={crawlStatus.isExpanded}
            isLoading={isLoading}
            onRowClick={() => setCrawlStatus(prev => ({ ...prev, isExpanded: !prev.isExpanded }))}
          />
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No results yet. Start crawling to see results here.
        </div>
      ),
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* URL Input and Start Button */}
      <div className="space-y-2">
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 items-start">
          <div className="w-full">
            <FormInput
              label=""
              value={url}
              onChange={setUrl}
              type="url"
              placeholder="https://example.com"
              className="w-full text-lg"
            />
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 hidden md:block">
              Enter the URL of the website you want to crawl. Make sure to include the protocol (http:// or https://).
            </p>
          </div>
          <div className="w-full pt-1">
            {crawlStatus.request?.status === 'running' ? (
              <button
                type="button"
                onClick={handleCancel}
                className="w-full md:w-auto px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Cancel Crawling
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || formErrors.plugin}
                className="w-full md:w-auto px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Starting...' : 'Start Crawling'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Options Tabs */}
      <div>
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide">
              <Tab.List className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 min-w-max">
                {tabs.map((tab) => (
                  <Tab
                    key={tab.name}
                    className={({ selected }) =>
                      classNames(
                        'px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none',
                        selected
                          ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                        (tab.name === 'Plugin Options' && formErrors.plugin)
                          ? 'text-red-500 dark:text-red-400'
                          : '',
                        (tab.name === 'Results' && crawlStatus.request)
                          ? 'text-primary-600 dark:text-primary-400'
                          : ''
                      )
                    }
                  >
                    {tab.name}
                    {(tab.name === 'Plugin Options' && formErrors.plugin) && (
                      <span className="ml-2 text-red-500">⚠️</span>
                    )}
                  </Tab>
                ))}
              </Tab.List>
            </div>
          </div>
          <Tab.Panels className="mt-4">
            {tabs.map((tab, idx) => (
              <Tab.Panel
                key={idx}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm ${(tab.name === 'Plugin Options' && formErrors.plugin)
                  ? 'ring-2 ring-red-500'
                  : ''
                  }`}
              >
                {tab.content}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </form>
  );
};
