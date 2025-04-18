import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Tab } from '@headlessui/react';
import { CrawlRequest } from '../../types/crawl';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/env';
import { apiKeysApi } from '../../services/api/apiKeys';
import { ApiKey } from '../../types/apiKeys';
import DocumentItem from './DocumentItem';

interface ApiDocumentationProps {
  request: CrawlRequest | null;
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

// Utility to convert JS object to Python dict string
function toPythonDict(obj: any, indent = 4, level = 1): string {
  if (obj === null || obj === undefined) return 'None';
  if (typeof obj === 'boolean') return obj ? 'True' : 'False';
  if (typeof obj === 'number') return obj.toString();
  if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`;
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj.map(i => toPythonDict(i, indent, level + 1));
    const pad = ' '.repeat(indent * level);
    return '[\n' + pad + items.join(',\n' + pad) + '\n' + ' '.repeat(indent * (level - 1)) + ']';
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    const pad = ' '.repeat(indent * level);
    return '{\n' +
      keys.map(k => `${pad}'${k}': ${toPythonDict(obj[k], indent, level + 1)}`).join(',\n') +
      '\n' + ' '.repeat(indent * (level - 1)) + '}';
  }
  return 'None';
}

// Utility to convert JS object to Node.js options string
function toNodeJsOptions(obj: any, indent = 2, level = 1): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'boolean' || typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`;
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj.map(i => toNodeJsOptions(i, indent, level + 1));
    const pad = ' '.repeat(indent * level);
    return '[\n' + pad + items.join(',\n' + pad) + '\n' + ' '.repeat(indent * (level - 1)) + ']';
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    const pad = ' '.repeat(indent * level);
    return '{\n' +
      keys.map(k => `${pad}${k}: ${toNodeJsOptions(obj[k], indent, level + 1)}`).join(',\n') +
      '\n' + ' '.repeat(indent * (level - 1)) + '}';
  }
  return 'null';
}

// Utility to convert JS object to Go map[string]interface{} string
function toGoMap(obj: any, indent = 2, level = 2): string {
  if (obj === null || obj === undefined) return 'nil';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return obj.toString();
  if (typeof obj === 'string') return `"${obj.replace(/"/g, '\\"')}"`;
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]interface{}{}';
    const items = obj.map(i => toGoMap(i, indent, level + 1));
    const pad = ' '.repeat(indent * level);
    return `[]interface{}{\n${pad}${items.join(',\n' + pad)}\n${' '.repeat(indent * (level - 1))}}`;
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return 'map[string]interface{}{}';
    const pad = ' '.repeat(indent * level);
    return `map[string]interface{}{\n${keys.map(k => `${pad}"${k}": ${toGoMap(obj[k], indent, level + 1)}`).join(',\n')}\n${' '.repeat(indent * (level - 1))}}`;
  }
  return 'nil';
}

export const ApiDocumentation: React.FC<ApiDocumentationProps> = ({ request }) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [loadingKeys, setLoadingKeys] = useState(false);

  useEffect(() => {
    const fetchKeys = async () => {
      setLoadingKeys(true);
      try {
        // Fetch all keys (first page, or implement pagination as needed)
        const res = await apiKeysApi.list(1);
        setApiKeys(res.results || []);
      } catch (_) {
        setApiKeys([]);
      } finally {
        setLoadingKeys(false);
      }
    };
    fetchKeys();
  }, []);

  // Helper for base URL
  const getBaseUrl = useCallback(() => {
    let url = API_URL;
    if (!/^https?:\/\//i.test(url)) {
      url = window.location.origin;
    }
    return url;
  }, []);

  const getApiKeyValue = useCallback(() => {
    if (selectedApiKey) {
      const keyObj = apiKeys.find(k => k.uuid === selectedApiKey);
      return keyObj ? keyObj.key : 'TEAM_API_KEY';
    }
    return 'TEAM_API_KEY';
  }, [apiKeys, selectedApiKey]);

  const generateCurlCommand = useCallback((request: CrawlRequest | null) => {
    if (!request) return 'No request data available';
    const data = {
      url: request.url,
      options: request.options
    };
    return `curl -X POST \\\n  "${getBaseUrl()}/api/v1/core/crawl-requests/" \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: ${getApiKeyValue()}" \\\n  -d '${JSON.stringify(data, null, 2)}'`;
  }, [getApiKeyValue, getBaseUrl]);

  const generatePythonCode = useCallback((request: CrawlRequest | null) => {
    const apiKey = getApiKeyValue();
    const baseUrl = getBaseUrl();
    const url = request?.url || 'https://example.com';
    // Build options objects (show as empty dicts or with real data if present)
    const spiderOptions = request?.options?.spider_options || {};
    const pageOptions = request?.options?.page_options || {};
    const pluginOptions = request?.options?.plugin_options || {};
    return `from watercrawl import WaterCrawlAPIClient\n\n# Initialize the client\nclient = WaterCrawlAPIClient(api_key='${apiKey}', base_url='${baseUrl}')\n\n# Advanced crawling with options\ncrawl_request = client.create_crawl_request(\n    url='${url}',\n    spider_options=${toPythonDict(spiderOptions, 4, 2)},\n    page_options=${toPythonDict(pageOptions, 4, 2)},\n    plugin_options=${toPythonDict(pluginOptions, 4, 2)}\n)`;
  }, [getApiKeyValue, getBaseUrl]);

  const generateNodeCode = useCallback((request: CrawlRequest | null) => {
    const apiKey = getApiKeyValue();
    const baseUrl = getBaseUrl();
    const url = request?.url || 'https://example.com';
    const spiderOptions = request?.options?.spider_options || {};
    const pageOptions = request?.options?.page_options || {};
    const pluginOptions = request?.options?.plugin_options || {};
    return `import { WaterCrawlAPIClient } from '@watercrawl/nodejs';\n\n// Initialize the client with your API key\nconst client = new WaterCrawlAPIClient('${apiKey}', '${baseUrl}');\n\nconst crawlRequest = await client.createCrawlRequest(\n  '${url}',\n  ${toNodeJsOptions(spiderOptions, 2, 2)},\n  ${toNodeJsOptions(pageOptions, 2, 2)},\n  ${toNodeJsOptions(pluginOptions, 2, 2)}\n);\nconsole.log(crawlRequest);`;
  }, [getApiKeyValue, getBaseUrl]);

  const generateGoCode = useCallback((request: CrawlRequest | null) => {
    const apiKey = getApiKeyValue();
    const baseUrl = getBaseUrl();
    const url = request?.url || 'https://example.com';
    const spiderOptions = request?.options?.spider_options || {};
    const pageOptions = request?.options?.page_options || {};
    const pluginOptions = request?.options?.plugin_options || {};
    return `import "github.com/watercrawl/watercrawl-go"\n\nclient := watercrawl.NewClient("${apiKey}", "${baseUrl}")  // Empty string uses default base URL\n\nctx := context.Background()\ninput := watercrawl.CreateCrawlRequestInput{\n    URL: "${url}",\n    Options: watercrawl.CrawlOptions{\n        SpiderOptions: ${toGoMap(spiderOptions, 4, 3)},\n        PageOptions: ${toGoMap(pageOptions, 4, 3)},\n        PluginOptions: ${toGoMap(pluginOptions, 4, 3)},\n    },\n}\n\nresult, err := client.CreateCrawlRequest(ctx, input)\nif err != nil {\n    log.Fatal(err)\n}`;
  }, [getApiKeyValue, getBaseUrl]);

  const tabs = useMemo(() => [
    { name: 'cURL', content: generateCurlCommand(request) },
    { name: 'Python', content: generatePythonCode(request) },
    { name: 'Node.js', content: generateNodeCode(request) },
    { name: 'Go', content: generateGoCode(request) },
  ], [request, generateCurlCommand, generatePythonCode, generateNodeCode, generateGoCode]);

  if (!request) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">API Documentation</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Enter a URL and configure options to see the API request example.</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">API Documentation</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Use our REST API to integrate web crawling capabilities into your applications. Below are examples in different programming languages.
        </p>
      </div>
      <div className="p-6">
        <Tab.Group>
          <Tab.List className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
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
          </Tab.List>
          <Tab.Panels className="mt-6">
            {tabs.map((tab, idx) => (
              <Tab.Panel key={idx}>
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
                      {/* API Key Dropdown for cURL and Python panels */}
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
                        onClick={() => copyToClipboard(tab.content)}
                        className="text-xs text-gray-400 hover:text-gray-300 focus:outline-none inline-flex items-center"
                      >
                        <ClipboardIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* cURL documentation info block */}
                  {tab.name === 'cURL' && (
                    <DocumentItem
                      content={tab.content}
                      documentTitle="API Documentation"
                      documentUrl="https://docs.watercrawl.dev/api/documentation/"
                      installCommand="no additional installation required"
                      language="python"
                    />
                  )}
                  {/* Python documentation info block */}
                  {tab.name === 'Python' && (
                    <DocumentItem
                      content={tab.content}
                      documentTitle="Python Client Documentation"
                      documentUrl="https://docs.watercrawl.dev/clients/python"
                      installCommand="pip install watercrawl-py"
                      language="python"
                    />
                  )}
                  {/* Node.js documentation info block */}
                  {tab.name === 'Node.js' && (
                    <DocumentItem
                      content={tab.content}
                      documentTitle="Node.js Client Documentation"
                      documentUrl="https://docs.watercrawl.dev/clients/nodejs"
                      installCommand="npm install @watercrawl/nodejs"
                      language="javascript"
                    />
                  )}
                  {/* Go documentation info block */}
                  {tab.name === 'Go' && (
                    <DocumentItem
                      content={tab.content}
                      documentTitle="Go Client Documentation"
                      documentUrl="https://github.com/watercrawl/watercrawl-go"
                      installCommand="go get github.com/watercrawl/watercrawl-go"
                      language="go"
                    />
                  )}

                </div>
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};
