import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { apiKeysApi } from '../../services/api/apiKeys';
import { ApiKey } from '../../types/apiKeys';
import DocumentItem from '../crawl/DocumentItem';
import { API_URL } from '../../utils/env';
import { classnames } from '../../lib/utils';

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


export const KnowledgeBaseApiDocumentation: React.FC<KnowledgeBaseApiDocumentationProps> = ({ knowledgeBaseId, query, top_k }) => {
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
        const selectedKey = apiKeys.find((k) => k.uuid === selectedApiKey);
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
            top_k: top_k
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
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('api.title')}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t('api.knowledgeBase.fullDescription')}
                </p>
            </div>
            <div className="p-6">
                <TabGroup>
                    <TabList className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            {tabs.map((tab) => (
                                <Tab
                                    key={tab.name}
                                    className={({ selected }) =>
                                        classnames({
                                            'px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none': true,
                                            'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white': selected,
                                            'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300': !selected
                                        })
                                    }
                                >
                                    {tab.name}
                                </Tab>
                            ))}
                        </div>
                    </TabList>
                    <TabPanels className="mt-4">
                        {tabs.map((tab) => (
                            <TabPanel key={tab.name}>
                                <div className="bg-[#1E1E1E] rounded-lg overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-2 bg-[#2D2D2D] border-b border-[#404040]">
                                        <div className="flex gap-x-2 items-center">
                                            <div className="flex gap-x-2">
                                                <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                                                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                                                <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                                            </div>
                                            <div className="text-xs text-gray-400 ms-4">{tab.name} {t('api.example')}</div>
                                        </div>
                                        <div className="flex items-center gap-x-2">
                                            <select
                                                id={`api-key-select-${tab.name}`}
                                                className="rounded-md border-gray-700 bg-[#23272b] text-gray-100 p-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 w-40"
                                                value={selectedApiKey}
                                                onChange={e => setSelectedApiKey(e.target.value)}
                                                disabled={loadingKeys}
                                            >
                                                <option value="">{t('api.selectApiKey')}</option>
                                                {apiKeys.map(key => (
                                                    <option key={key.uuid} value={key.uuid}>{key.name} ({key.key.slice(0, 6)}...)</option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(typeof tab.content === 'function' ? tab.content() : tab.content, t)}
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
