import React, { useState, useEffect, useCallback } from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { apiKeysApi } from '../../services/api/apiKeys';
import { ApiKey } from '../../types/apiKeys';
import DocumentItem from '../playground/DocumentItem';
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

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch (_) {
    toast.error('Failed to copy to clipboard');
  }
};

export const SearchApiDocumentation: React.FC<SearchApiDocumentationProps> = ({ query = "example search query", options = null }) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const defaultOptions = {
    language: "",
    country: "",
    timeRange: TimeRange.Any,
    numResults: 5,
    depth: Depth.Basic
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

        // Set first key as selected by default if available
        if (response.results.length > 0) {
          setSelectedApiKey(response.results[0].uuid);
        }
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
        depth: searchOptions.depth || Depth.Basic
      },
      result_limit: searchOptions.numResults || 5
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
        depth: searchOptions.depth || Depth.Basic
      },
      result_limit: searchOptions.numResults || 5
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
  ${query},
  {
    language: ${searchOptions.language ? `'${searchOptions.language}'` : 'null'},
    country: ${searchOptions.country ? `'${searchOptions.country}'` : 'null'},
    timeRange: ${searchOptions.timeRange ? `'${searchOptions.timeRange}'` : 'null'},
    searchType: 'web',
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

  const generateGoCommand = useCallback(() => {
    const apiKey = getApiKeyForExample();
    const baseUrl = getBaseUrl();

    return `package main

import (
	"fmt"
	"github.com/watercrawl/watercrawl-go"
)

func main() {
	// Initialize the client
	client := watercrawl.NewClient("${apiKey}", "${baseUrl}")
	
	// Create search options
	searchOptions := watercrawl.SearchOptions{
		Language:   ${searchOptions.language ? `"${searchOptions.language}"` : `""`},
		Country:    ${searchOptions.country ? `"${searchOptions.country}"` : `""`},
		TimeRange:  ${searchOptions.timeRange ? `"${searchOptions.timeRange}"` : `""`},
		SearchType: "web",
		Depth:      "${searchOptions.depth}",
	}
	
	// Create search request
	searchReq, err := client.CreateSearchRequest("${query}", searchOptions, ${searchOptions.numResults})
	if err != nil {
		fmt.Printf("Error creating search request: %v\\n", err)
		return
	}
	
	fmt.Printf("Search request ID: %s\\n", searchReq.ID)
	fmt.Printf("Status: %s\\n", searchReq.Status)
	fmt.Printf("Results: %d\\n", len(searchReq.Results))
}`;
  }, [getBaseUrl, query, searchOptions, getApiKeyForExample]);

  const tabs = [
    { name: 'cURL', content: generateCurlCommand },
    { name: 'Python', content: generatePythonCommand },
    { name: 'Node.js', content: generateNodeJsCommand },
    { name: 'Go', content: generateGoCommand },
  ];

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">API Documentation</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Use our REST API to integrate web crawling capabilities into your applications. Below are examples in different programming languages.
        </p>
      </div>
      <div className="p-6">
        <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab}>
          <TabList className="flex p-1 space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none',
                    selected
                      ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  )
                }
              >
                {tab.name}
              </Tab>
            ))}
          </TabList>
          <TabPanels className="mt-4">
            {tabs.map((tab, idx) => (
              <TabPanel
                key={idx}
                className={classNames(
                  'rounded-lg focus:outline-none'
                )}
              >
                <div className="bg-[#1E1E1E] rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#2D2D2D] border-b border-[#404040]">
                    <div className="flex space-x-2 items-center">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                      </div>
                      <div className="text-xs text-gray-400 ml-4">{tab.name} Example</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        id={`api-key-select-${tab.name}`}
                        className="rounded-md border-gray-700 bg-[#23272b] text-gray-100 p-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 w-40"
                        value={selectedApiKey}
                        onChange={e => setSelectedApiKey(e.target.value)}
                        disabled={loadingKeys}
                      >
                        <option value="">API key...</option>
                        {apiKeys.map(key => (
                          <option key={key.uuid} value={key.uuid}>{key.name} ({key.key.slice(0, 6)}...)</option>
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
                          copyToClipboard(content);
                        }}
                        className="text-xs text-gray-400 hover:text-gray-300 focus:outline-none inline-flex items-center"
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
                      documentUrl="https://docs.watercrawl.dev/api/search-documentation/"
                      installCommand="no additional installation required"
                      language="bash"
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
