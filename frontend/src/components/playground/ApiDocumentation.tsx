import React, { useMemo } from 'react';
import { Tab } from '@headlessui/react';
import { CrawlRequest } from '../../types/crawl';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/env';

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
  } catch (err) {
    toast.error('Failed to copy to clipboard');
  }
};

export const ApiDocumentation: React.FC<ApiDocumentationProps> = ({ request }) => {
  const generateCurlCommand = (request: CrawlRequest | null) => {
    if (!request) return 'No request data available';
    
    const data = {
      url: request.url,
      options: request.options
    };
    
    return `curl -X POST \\
  "${API_URL}/api/v1/core/crawl-requests/" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: TEAM_API_KEY" \\
  -d '${JSON.stringify(data, null, 2)}'`;
  };

  const generatePythonCode = (_: CrawlRequest | null) => {
    return `coming soon ...`; 
  };

  const generateNodeCode = (_: CrawlRequest | null) => {
    return `coming soon ...`;
  };

  const generateGoCode = (_: CrawlRequest | null) => {
    return `coming soon ...`;
  };

  const tabs = useMemo(() => [
    { name: 'cURL', content: generateCurlCommand(request) },
    { name: 'Python', content: generatePythonCode(request) },
    { name: 'Node.js', content: generateNodeCode(request) },
    { name: 'Go', content: generateGoCode(request) },
  ], [request]);

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
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                    </div>
                    <div className="text-xs text-gray-400">{tab.name} Example</div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(tab.content)}
                      className="text-xs text-gray-400 hover:text-gray-300 focus:outline-none inline-flex items-center"
                    >
                      <ClipboardIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-4 font-mono text-sm text-gray-300 overflow-x-auto">
                    <pre className="whitespace-pre">{tab.content}</pre>
                  </div>
                </div>
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};
