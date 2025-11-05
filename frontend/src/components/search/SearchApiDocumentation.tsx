import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { apiKeysApi } from '../../services/api/apiKeys';
import { ApiKey } from '../../types/apiKeys';
import DocumentItem from '../crawl/DocumentItem';
import { API_URL } from '../../utils/env';
import { TimeRange, Depth, SearchType } from '../../types/search';

interface SearchApiDocumentationProps {
  query?: string;
  options?: {
    language: string;
    timeRange: TimeRange;
    numResults: number;
    country: string;
    depth: Depth;
  } | null;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const copyToClipboard = async (text: string, t: any) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(t('common.copiedToClipboard'));
  } catch (_) {
    toast.error(t('common.copyFailed'));
  }
};

export const SearchApiDocumentation: React.FC<SearchApiDocumentationProps> = ({
  query = 'example search query',
  options = null,
}) => {
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const defaultOptions = {
    language: '',
    country: '',
    timeRange: TimeRange.Any,
    numResults: 5,
    depth: Depth.Basic,
  };

  const searchOptions = options || defaultOptions;

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoadingKeys(true);
      // Pass page=1 to the list method since it expects a number parameter
      const response = await apiKeysApi.list(1);

      if (response && response.results) {
        setApiKeys(response.results);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoadingKeys(false);
    }
  };

  const getApiKeyForExample = useCallback(() => {
    const selectedKey = apiKeys.find(k => k.uuid === selectedApiKey);
    return selectedKey ? selectedKey.key : 'YOUR_API_KEY';
  }, [apiKeys, selectedApiKey]);

  const getBaseUrl = useCallback(() => {
    let url = API_URL;
    if (!/^https?:\/\//i.test(url)) {
      url = window.location.origin;
    }
    return url;
  }, []);

  const generateCurlCommand = useCallback(() => {
    const apiKey = getApiKeyForExample();

    // Create the search options object based on provided options or defaults
    const searchBody = {
      query: query,
      search_options: {
        language: searchOptions.language || undefined,
        country: searchOptions.country || undefined,
        time_range: searchOptions.timeRange || undefined,
        search_type: SearchType.Web,
        depth: searchOptions.depth || Depth.Basic,
      },
      result_limit: searchOptions.numResults || 5,
    };

    // Filter out undefined values for cleaner JSON
    const searchOptionsCopy = { ...searchBody.search_options };
    Object.keys(searchOptionsCopy).forEach(key => {
      if (searchOptionsCopy[key as keyof typeof searchOptionsCopy] === undefined) {
        delete searchOptionsCopy[key as keyof typeof searchOptionsCopy];
      }
    });
    searchBody.search_options = searchOptionsCopy;

    // Format the command
    return `curl -X POST "${getBaseUrl()}/api/v1/core/search/" \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: ${apiKey}" \\
  -d '${JSON.stringify(searchBody, null, 2)}'`;
  }, [getBaseUrl, query, searchOptions, getApiKeyForExample]);

  const generatePythonCommand = useCallback(() => {
    const apiKey = getApiKeyForExample();
    const baseUrl = getBaseUrl();

    // Create the search options object based on provided options or defaults
    const searchBody = {
      query: query,
      search_options: {
        language: searchOptions.language || undefined,
        country: searchOptions.country || undefined,
        time_range: searchOptions.timeRange || undefined,
        search_type: SearchType.Web,
        depth: searchOptions.depth || Depth.Basic,
      },
      result_limit: searchOptions.numResults || 5,
    };

    // Filter out undefined values for cleaner JSON
    const searchOptionsCopy = { ...searchBody.search_options };
    Object.keys(searchOptionsCopy).forEach(key => {
      if (searchOptionsCopy[key as keyof typeof searchOptionsCopy] === undefined) {
        delete searchOptionsCopy[key as keyof typeof searchOptionsCopy];
      }
    });

    return `from watercrawl import WaterCrawlAPIClient

# Initialize the client
client = WaterCrawlAPIClient(api_key='${apiKey}', base_url='${baseUrl}')

# Create search request
search_request = client.create_search_request(
    query='${query}',
    search_options={
        'language': ${searchOptions.language ? `'${searchOptions.language}'` : 'None'},
        'country': ${searchOptions.country ? `'${searchOptions.country}'` : 'None'},
        'time_range': ${searchOptions.timeRange ? `'${searchOptions.timeRange}'` : 'None'},
        'search_type': 'web',
        'depth': '${searchOptions.depth}'
    },
    result_limit=${searchOptions.numResults},
    sync=True,      # Default: True - wait for results
    download=True  # Default: True - get download links. Set to False for direct JSON results
)

# Get search results
print(f"Search request ID: {search_request.id}")
print(f"Status: {search_request.status}")
print(f"Results count: {len(search_request.results) if search_request.results else 0}")
`;
  }, [getBaseUrl, query, searchOptions, getApiKeyForExample]);

  const generateNodeJsCommand = useCallback(() => {
    const apiKey = getApiKeyForExample();
    const baseUrl = getBaseUrl();

    return `import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize the client with your API key
const client = new WaterCrawlAPIClient('${apiKey}', '${baseUrl}');

// Create a search request
const searchRequest = await client.createSearchRequest(
  '${query}',
  {
    language: ${searchOptions.language ? `'${searchOptions.language}'` : 'null'},
    country: ${searchOptions.country ? `'${searchOptions.country}'` : 'null'},
    time_range: ${searchOptions.timeRange ? `'${searchOptions.timeRange}'` : 'null'},
    search_type: 'web',
    depth: '${searchOptions.depth}'
  },
  ${searchOptions.numResults},
  true,       // Default: true - wait for results
  true   // Default: true - get download links. Set to false for direct JSON results
);

console.log('Search request ID:', searchRequest.id);
console.log('Status:', searchRequest.status);
console.log('Results count:', searchRequest.results ? searchRequest.results.length : 0);
`;
  }, [getBaseUrl, query, searchOptions, getApiKeyForExample]);

  const tabs = [
    { name: 'cURL', content: generateCurlCommand },
    { name: 'Python', content: generatePythonCommand },
    { name: 'Node.js', content: generateNodeJsCommand },
  ];

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-base font-semibold text-foreground">{t('api.title')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('api.search.fullDescription')}</p>
      </div>
      <div className="p-6">
        <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab}>
          <TabList className="flex gap-x-1 rounded-lg bg-muted p-1">
            {tabs.map(tab => (
              <Tab
                key={tab.name}
                className={({ selected }: { selected: boolean }) =>
                  classNames(
                    'px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none',
                    selected
                      ? 'border-b-2 border-primary-strong text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                {tab.name}
              </Tab>
            ))}
          </TabList>
          <TabPanels className="mt-4">
            {tabs.map((tab, idx) => (
              <TabPanel key={idx} className={classNames('rounded-lg focus:outline-none')}>
                <div className="overflow-hidden rounded-lg bg-[#1E1E1E]">
                  <div className="flex items-center justify-between border-b border-[#404040] bg-[#2D2D2D] px-4 py-2">
                    <div className="flex items-center gap-x-2">
                      <div className="flex gap-x-2">
                        <div className="h-3 w-3 rounded-full bg-[#FF5F56]"></div>
                        <div className="h-3 w-3 rounded-full bg-[#FFBD2E]"></div>
                        <div className="h-3 w-3 rounded-full bg-[#27C93F]"></div>
                      </div>
                      <div className="ms-4 text-xs text-muted-foreground">
                        {tab.name} {t('api.example')}
                      </div>
                    </div>
                    <div className="flex items-center gap-x-2">
                      <select
                        id={`api-key-select-${tab.name}`}
                        className="w-40 rounded-md border-border bg-muted p-1 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        value={selectedApiKey}
                        onChange={e => setSelectedApiKey(e.target.value)}
                        disabled={loadingKeys}
                      >
                        <option value="">{t('api.selectApiKey')}</option>
                        {apiKeys.map(key => (
                          <option key={key.uuid} value={key.uuid}>
                            {key.name} ({key.key.slice(0, 6)}...)
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          let content;
                          if (typeof tab.content === 'function') {
                            content = tab.content();
                          } else {
                            content = tab.content;
                          }
                          copyToClipboard(content, t);
                        }}
                        className="inline-flex items-center text-xs text-muted-foreground hover:text-muted-foreground focus:outline-none"
                      >
                        <ClipboardIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* cURL documentation info block */}
                  {tab.name === 'cURL' && (
                    <DocumentItem
                      content={typeof tab.content === 'function' ? tab.content() : tab.content}
                      documentTitle="API Documentation"
                      documentUrl="https://docs.watercrawl.dev/api/documentation/"
                      installCommand="no additional installation required"
                      language="python"
                    />
                  )}
                  {/* Python documentation info block */}
                  {tab.name === 'Python' && (
                    <DocumentItem
                      content={typeof tab.content === 'function' ? tab.content() : tab.content}
                      documentTitle="Python Client Documentation"
                      documentUrl="https://docs.watercrawl.dev/clients/python"
                      installCommand="pip install watercrawl-py"
                      language="python"
                    />
                  )}
                  {/* Node.js documentation info block */}
                  {tab.name === 'Node.js' && (
                    <DocumentItem
                      content={typeof tab.content === 'function' ? tab.content() : tab.content}
                      documentTitle="Node.js Client Documentation"
                      documentUrl="https://docs.watercrawl.dev/clients/nodejs"
                      installCommand="npm install @watercrawl/nodejs"
                      language="javascript"
                    />
                  )}
                  {/* Go documentation info block */}
                  {tab.name === 'Go' && (
                    <DocumentItem
                      content={typeof tab.content === 'function' ? tab.content() : tab.content}
                      documentTitle="Go Client Documentation"
                      documentUrl="https://github.com/watercrawl/watercrawl-go"
                      installCommand="go get github.com/watercrawl/watercrawl-go"
                      language="go"
                    />
                  )}
                </div>
              </TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
};
