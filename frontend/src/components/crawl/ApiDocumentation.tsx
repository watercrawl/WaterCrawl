import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { CrawlRequest } from '../../types/crawl';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/env';
import { apiKeysApi } from '../../services/api/apiKeys';
import { ApiKey } from '../../types/apiKeys';
import DocumentItem from './DocumentItem';

interface ApiDocumentationProps {
  request: CrawlRequest | null;
  isBatch: boolean;
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
    return (
      '{\n' +
      keys.map(k => `${pad}'${k}': ${toPythonDict(obj[k], indent, level + 1)}`).join(',\n') +
      '\n' +
      ' '.repeat(indent * (level - 1)) +
      '}'
    );
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
    return (
      '{\n' +
      keys.map(k => `${pad}${k}: ${toNodeJsOptions(obj[k], indent, level + 1)}`).join(',\n') +
      '\n' +
      ' '.repeat(indent * (level - 1)) +
      '}'
    );
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

export const ApiDocumentation: React.FC<ApiDocumentationProps> = ({ request, isBatch }) => {
  const { t } = useTranslation();
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

  const generateCurlCommand = useCallback(
    (request: CrawlRequest | null) => {
      if (!request) return t('api.noRequestData');
      const data = isBatch
        ? {
            urls: request.urls,
            options: request.options,
          }
        : {
            url: request.url,
            options: request.options,
          };
      return `curl -X POST \\
  "${getBaseUrl()}/api/v1/core/crawl-requests/${isBatch ? 'batch/' : ''}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${getApiKeyValue()}" \\
  -d '${JSON.stringify(data, null, 2)}'`;
    },
    [getApiKeyValue, getBaseUrl, isBatch, t]
  );

  const generatePythonCode = useCallback(
    (request: CrawlRequest | null) => {
      const apiKey = getApiKeyValue();
      const baseUrl = getBaseUrl();
      // Build options objects (show as empty dicts or with real data if present)
      const spiderOptions = request?.options?.spider_options || {};
      const pageOptions = request?.options?.page_options || {};
      const pluginOptions = request?.options?.plugin_options || {};

      if (isBatch) {
        const urls = request?.urls || ['https://example.com', 'https://example.org'];
        return `from watercrawl import WaterCrawlAPIClient

# Initialize the client
client = WaterCrawlAPIClient(api_key='${apiKey}', base_url='${baseUrl}')

# Advanced batch crawling with options
crawl_request = client.create_batch_crawl_request(
    urls=${toPythonDict(urls, 4, 2)},
    spider_options=${toPythonDict(spiderOptions, 4, 2)},
    page_options=${toPythonDict(pageOptions, 4, 2)},
    plugin_options=${toPythonDict(pluginOptions, 4, 2)}
)`;
      } else {
        const url = request?.url || 'https://example.com';
        return `from watercrawl import WaterCrawlAPIClient

# Initialize the client
client = WaterCrawlAPIClient(api_key='${apiKey}', base_url='${baseUrl}')

# Advanced crawling with options
crawl_request = client.create_crawl_request(
    url='${url}',
    spider_options=${toPythonDict(spiderOptions, 4, 2)},
    page_options=${toPythonDict(pageOptions, 4, 2)},
    plugin_options=${toPythonDict(pluginOptions, 4, 2)}
)`;
      }
    },
    [getApiKeyValue, getBaseUrl, isBatch]
  );

  const generateNodeCode = useCallback(
    (request: CrawlRequest | null) => {
      const apiKey = getApiKeyValue();
      const baseUrl = getBaseUrl();
      const spiderOptions = request?.options?.spider_options || {};
      const pageOptions = request?.options?.page_options || {};
      const pluginOptions = request?.options?.plugin_options || {};

      if (isBatch) {
        const urls = request?.urls || ['https://example.com', 'https://example.org'];
        return `import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize the client with your API key
const client = new WaterCrawlAPIClient('${apiKey}', '${baseUrl}');

const crawlRequest = await client.createBatchCrawlRequest(
  ${toNodeJsOptions(urls, 2, 2)},
  ${toNodeJsOptions(spiderOptions, 2, 2)},
  ${toNodeJsOptions(pageOptions, 2, 2)},
  ${toNodeJsOptions(pluginOptions, 2, 2)}
);
console.log(crawlRequest);`;
      } else {
        const url = request?.url || 'https://example.com';
        return `import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize the client with your API key
const client = new WaterCrawlAPIClient('${apiKey}', '${baseUrl}');

const crawlRequest = await client.createCrawlRequest(
  '${url}',
  ${toNodeJsOptions(spiderOptions, 2, 2)},
  ${toNodeJsOptions(pageOptions, 2, 2)},
  ${toNodeJsOptions(pluginOptions, 2, 2)}
);
console.log(crawlRequest);`;
      }
    },
    [getApiKeyValue, getBaseUrl, isBatch]
  );

  const generateGoCode = useCallback(
    (request: CrawlRequest | null) => {
      const apiKey = getApiKeyValue();
      const baseUrl = getBaseUrl();
      const spiderOptions = request?.options?.spider_options || {};
      const pageOptions = request?.options?.page_options || {};
      const pluginOptions = request?.options?.plugin_options || {};

      if (isBatch) {
        const urls = request?.urls || ['https://example.com', 'https://example.org'];
        return `import "github.com/watercrawl/watercrawl-go"

client := watercrawl.NewClient("${apiKey}", "${baseUrl}")  // Empty string uses default base URL

ctx := context.Background()
input := watercrawl.CreateBatchCrawlRequestInput{
    URLs: ${toGoMap(urls, 4, 3)},
    Options: watercrawl.CrawlOptions{
        SpiderOptions: ${toGoMap(spiderOptions, 4, 3)},
        PageOptions: ${toGoMap(pageOptions, 4, 3)},
        PluginOptions: ${toGoMap(pluginOptions, 4, 3)},
    },
}

result, err := client.CreateBatchCrawlRequest(ctx, input)
if err != nil {
    log.Fatal(err)
}`;
      } else {
        const url = request?.url || 'https://example.com';
        return `import "github.com/watercrawl/watercrawl-go"

client := watercrawl.NewClient("${apiKey}", "${baseUrl}")  // Empty string uses default base URL

ctx := context.Background()
input := watercrawl.CreateCrawlRequestInput{
    URL: "${url}",
    Options: watercrawl.CrawlOptions{
        SpiderOptions: ${toGoMap(spiderOptions, 4, 3)},
        PageOptions: ${toGoMap(pageOptions, 4, 3)},
        PluginOptions: ${toGoMap(pluginOptions, 4, 3)},
    },
}

result, err := client.CreateCrawlRequest(ctx, input)
if err != nil {
    log.Fatal(err)
}`;
      }
    },
    [getApiKeyValue, getBaseUrl, isBatch]
  );

  const tabs = useMemo(
    () => [
      { name: 'cURL', content: generateCurlCommand(request) },
      { name: 'Python', content: generatePythonCode(request) },
      { name: 'Node.js', content: generateNodeCode(request) },
      { name: 'Go', content: generateGoCode(request) },
    ],
    [request, generateCurlCommand, generatePythonCode, generateNodeCode, generateGoCode]
  );

  if (!request) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-medium text-foreground">{t('api.title')}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t('api.crawl.description')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-base font-semibold text-foreground">{t('api.title')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('api.crawl.fullDescription')}</p>
      </div>
      <div className="p-6">
        <TabGroup>
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
          <TabPanels className="mt-6">
            {tabs.map((tab, idx) => (
              <TabPanel key={idx}>
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
                      {/* API Key Dropdown for cURL and Python panels */}
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
                        onClick={() => copyToClipboard(tab.content, t)}
                        className="inline-flex items-center text-xs text-muted-foreground hover:text-muted-foreground focus:outline-none"
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
              </TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
};
