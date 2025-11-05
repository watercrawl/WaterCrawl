import React, { useState, useEffect, useCallback } from 'react';

import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { ClipboardIcon } from '@heroicons/react/24/outline';

import DocumentItem from '../crawl/DocumentItem';

import { classnames } from '../../lib/utils';
import { apiKeysApi } from '../../services/api/apiKeys';
import { ApiKey } from '../../types/apiKeys';
import { API_URL } from '../../utils/env';

interface KnowledgeBaseApiDocumentationProps {
  knowledgeBaseId: string;
  query: string;
  top_k: number;
}

const copyToClipboard = async (text: string, t: any) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(t('common.copiedToClipboard'));
  } catch (_) {
    toast.error(t('common.copyFailed'));
  }
};

export const KnowledgeBaseApiDocumentation: React.FC<KnowledgeBaseApiDocumentationProps> = ({
  knowledgeBaseId,
  query,
  top_k,
}) => {
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [loadingKeys, setLoadingKeys] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoadingKeys(true);
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
    if (!url || !/^https?:\/\//i.test(url)) {
      url = window.location.origin;
    }
    return url;
  }, []);

  const generateCurlCommand = useCallback(() => {
    const apiKey = getApiKeyForExample();
    const baseUrl = getBaseUrl();
    const requestBody = {
      query: query || 'your query here',
      top_k: top_k,
    };

    return `curl -X POST "${baseUrl}/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseId}/query/" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '${JSON.stringify(requestBody, null, 2)}'`;
  }, [getBaseUrl, knowledgeBaseId, getApiKeyForExample, query, top_k]);

  const generatePythonCommand = useCallback(() => {
    const apiKey = getApiKeyForExample();
    const baseUrl = getBaseUrl();

    return `from watercrawl import WaterCrawlAPIClient

# Initialize the client
client = WaterCrawlAPIClient(api_key='${apiKey}', base_url='${baseUrl}')

# Query the knowledge base
results = client.query_knowledge_base(
    knowledge_base_id='${knowledgeBaseId}',
    query='${query || 'your query here'}',
    top_k=${top_k}
)

# Print the results
print(f"Found {len(results)} relevant chunks:")
for i, chunk in enumerate(results, 1):
    print(f"Chunk {i}:")
    print(f"  Content: {chunk['content']}")
    print(f"  Source: {chunk['metadata']['source']}")
    print(f"  Index: {chunk['metadata']['index']}")
    print(f"  UUID: {chunk['metadata']['uuid']}")
    print(f"  Keywords: {', '.join(chunk['metadata']['keywords'])}")
    print("---")`;
  }, [getBaseUrl, knowledgeBaseId, getApiKeyForExample, query, top_k]);

  const generateNodeJsCommand = useCallback(() => {
    const apiKey = getApiKeyForExample();
    const baseUrl = getBaseUrl();

    return `import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize the client with your API key
const client = new WaterCrawlAPIClient('${apiKey}', '${baseUrl}');

const queryKnowledgeBase = async () => {
  try {
    const results = await client.queryKnowledgeBase(
    '${knowledgeBaseId}', // Knowledge base ID
    '${query || 'your query here'}', // Query
    ${top_k} // Number of results
    );

    console.log(\`Found \${results.length} relevant chunks:\`);
    results.forEach((chunk, index) => {
      console.log(\`Chunk \${index + 1}:\`);
      console.log(\`  Content: \${chunk.content}\`);
      console.log(\`  Source: \${chunk.metadata.source}\`);
      console.log(\`  Index: \${chunk.metadata.index}\`);
      console.log(\`  UUID: \${chunk.metadata.uuid}\`);
      console.log(\`  Keywords: \${chunk.metadata.keywords.join(', ')}\`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error querying knowledge base:', error);
  }
};

queryKnowledgeBase();`;
  }, [getBaseUrl, knowledgeBaseId, getApiKeyForExample, query, top_k]);

  const tabs = [
    { name: 'cURL', content: generateCurlCommand },
    { name: 'Python', content: generatePythonCommand },
    { name: 'Node.js', content: generateNodeJsCommand },
  ];

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-base font-semibold text-foreground">{t('api.title')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('api.knowledgeBase.fullDescription')}
        </p>
      </div>
      <div className="p-6">
        <TabGroup>
          <TabList className="flex items-center justify-between border-b border-border">
            <div className="flex items-center">
              {tabs.map(tab => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classnames({
                      'px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none': true,
                      'border-b-2 border-border text-foreground': selected,
                      'text-muted-foreground hover:text-foreground': !selected,
                    })
                  }
                >
                  {tab.name}
                </Tab>
              ))}
            </div>
          </TabList>
          <TabPanels className="mt-4">
            {tabs.map(tab => (
              <TabPanel key={tab.name}>
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
                        onClick={() =>
                          copyToClipboard(
                            typeof tab.content === 'function' ? tab.content() : tab.content,
                            t
                          )
                        }
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
                </div>
              </TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
};
