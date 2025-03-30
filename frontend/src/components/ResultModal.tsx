import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Tab } from '@headlessui/react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Editor from "@monaco-editor/react";
import { CrawlResult } from '../types/crawl';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CrawlResult;
}

interface ResultData {
  markdown?: string;
  links?: string[];
  raw?: any;
}

export default function ResultModal({ isOpen, onClose, result }: ResultModalProps) {
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!result?.result) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(result.result);
        if (!response.ok) {
          throw new Error('Failed to fetch result data');
        }
        const jsonData = await response.json();
        setData({
          markdown: jsonData.markdown || '',
          links: jsonData.links || [],
          raw: jsonData
        });
      } catch (error) {
        console.error('Error fetching result data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load result data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && result) {
      fetchData();
    }

    return () => {
      // Cleanup when modal closes
      setData(null);
      setLoading(true);
      setError(null);
    };
  }, [isOpen, result]);

  if (!isOpen) return null;

  const getTabClassName = (selected: boolean) => {
    return `${
      selected 
        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow' 
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    } w-full rounded-lg py-2.5 text-sm font-medium leading-5 focus:outline-none ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60 px-4 transition-all`;
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
    </div>
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20"
    >
      <div className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75" />
      <div className="relative mx-auto max-w-6xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl ring-1 ring-black/5">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <div className="h-[80vh] overflow-hidden">
            {error ? (
              <div className="flex items-center justify-center h-full text-red-500 dark:text-red-400">
                {error}
              </div>
            ) : (
              <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-t-xl bg-gray-100 dark:bg-gray-900/50 p-2">
                  <Tab className={({ selected }) => getTabClassName(selected)}>
                    Markdown
                  </Tab>
                  <Tab className={({ selected }) => getTabClassName(selected)}>
                    JSON
                  </Tab>
                  {result.attachments && result.attachments.length > 0 && (
                    <Tab className={({ selected }) => getTabClassName(selected)}>
                      Attachments ({result.attachments.length})
                    </Tab>
                  )}
                </Tab.List>
                <Tab.Panels className="h-[calc(80vh-4rem)] overflow-auto">
                  <Tab.Panel className="h-full overflow-auto bg-white dark:bg-gray-700 p-6 dark:text-gray-100">
                    {loading ? (
                      <LoadingSpinner />
                    ) : (
                      <div className="prose dark:prose-invert max-w-none">
                        <pre>{data?.markdown || 'No content available'}</pre>
                      </div>
                    )}
                  </Tab.Panel>
                  <Tab.Panel className="h-full overflow-auto bg-white dark:bg-gray-800">
                    {loading ? (
                      <LoadingSpinner />
                    ) : (
                      <Editor
                        height="100%"
                        defaultLanguage="json"
                        defaultValue={JSON.stringify(data?.raw || {}, null, 2)}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          fontSize: 13,
                        }}
                        theme="vs-dark"
                      />
                    )}
                  </Tab.Panel>
                  {result.attachments && result.attachments.length > 0 && (
                    <Tab.Panel className="h-full overflow-auto bg-white dark:bg-gray-800 p-6">
                      <div className="space-y-3">
                        {result.attachments.map((attachment) => (
                          <div 
                            key={attachment.uuid} 
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="text-sm text-gray-900 dark:text-white">
                              {attachment.filename}
                            </div>
                            <a
                              href={attachment.attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                              <span>Download</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    </Tab.Panel>
                  )}
                </Tab.Panels>
              </Tab.Group>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
