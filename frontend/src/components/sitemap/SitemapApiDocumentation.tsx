import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { apiKeysApi } from '../../services/api/apiKeys';
import { ApiKey } from '../../types/apiKeys';
import DocumentItem from '../crawl/DocumentItem';
import { API_URL } from '../../utils/env';
import { SitemapRequest } from '../../types/sitemap';
import { classnames } from '../../lib/utils';

interface SitemapApiDocumentationProps {
  request?: SitemapRequest | null;
}

export const SitemapApiDocumentation: React.FC<SitemapApiDocumentationProps> = ({ request }) => {
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('common.copiedToClipboard'));
    } catch (_) {
      toast.error(t('common.copyFailed'));
    }
  };

  const generateCurlCommand = useCallback(() => {
    const apiKey = getApiKeyForExample();
    const baseUrl = getBaseUrl();

    return `curl -X POST "${baseUrl}/api/v1/core/sitemaps/" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '${JSON.stringify(request, null, 2)}'`;
  }, [getBaseUrl, request, getApiKeyForExample]);

  const generatePythonCommand = useCallback(() => {
    const apiKey = getApiKeyForExample();
    const baseUrl = getBaseUrl();

    return `from watercrawl import WaterCrawlAPIClient

# Initialize the client
client = WaterCrawlAPIClient(api_key='${apiKey}', base_url='${baseUrl}')

# Create sitemap request
sitemap_request = client.create_sitemap_request(
    url='${request?.url || 'https://example.com'}',
    options={
        'include_subdomains': ${request?.options?.include_subdomains || 'True'},
        'ignore_sitemap_xml': ${request?.options?.ignore_sitemap_xml || 'False'}
    }
)

# Get request UUID
request_uuid = sitemap_request.uuid
print(f"Sitemap request ID: {request_uuid}")`;
  }, [getBaseUrl, request, getApiKeyForExample]);

  const generateNodeJsCommand = useCallback(() => {
    const apiKey = getApiKeyForExample();
    const baseUrl = getBaseUrl();

    return `import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize the client with your API key
const client = new WaterCrawlAPIClient('${apiKey}', '${baseUrl}');

const sitemapRequest = await client.createSitemapRequest({
  url: '${request?.url || 'https://example.com'}',
  options: {
    includeSubdomains: ${request?.options?.include_subdomains || 'true'},
    ignoreSitemapXml: ${request?.options?.ignore_sitemap_xml || 'false'}
  }
});

console.log('Sitemap request created:', sitemapRequest.uuid);`;
  }, [getBaseUrl, request, getApiKeyForExample]);

  if (!request) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-medium text-foreground">{t('api.title')}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t('api.sitemap.description')}</p>
      </div>
    );
  }

  const tabs = [
    { name: 'cURL', content: generateCurlCommand },
    { name: 'Python', content: generatePythonCommand },
    { name: 'Node.js', content: generateNodeJsCommand },
  ];

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-base font-semibold text-foreground">{t('api.title')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('api.sitemap.fullDescription')}</p>
      </div>
      <div className="p-6">
        <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab}>
          <TabList className="flex gap-x-1 rounded-lg bg-muted p-1">
            {tabs.map(tab => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classnames({
                    'px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none': true,
                    'border-b-2 border-primary-strong text-primary': selected,
                    'text-muted-foreground hover:text-foreground': !selected,
                  })
                }
              >
                {tab.name}
              </Tab>
            ))}
          </TabList>
          <TabPanels className="mt-6">
            {tabs.map((tab, idx) => (
              <TabPanel key={idx} className="focus:outline-none">
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
                        onClick={() => copyToClipboard(tab.content())}
                        className="inline-flex items-center text-xs text-muted-foreground hover:text-muted-foreground focus:outline-none"
                      >
                        <ClipboardIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Documentation info block */}
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
                </div>
              </TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
};
