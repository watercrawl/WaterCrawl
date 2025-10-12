import { useTranslation } from 'react-i18next';
import { Dialog } from '@headlessui/react';
import { Tab } from '@headlessui/react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Editor from "@monaco-editor/react";
import { CrawlResult, ResultData } from '../types/crawl';

interface CrawlResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CrawlResult;
}

export default function CrawlResultModal({ isOpen, onClose, result }: CrawlResultModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;


  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20"
    >
      <div className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75" />
      <div className="relative mx-auto max-w-4xl">
        <div className="w-full transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-start align-middle shadow-xl transition-all">
          <div className="absolute top-0 end-0 pt-4 pe-4">
            <button
              onClick={onClose}
              className="bg-white dark:bg-gray-900 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Title Box with URL */}
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title as="h3" className="text-xl leading-6 font-semibold text-gray-900 dark:text-white">
              {result.url ? (
                <span className="truncate max-w-lg block" title={result.url}>{result.url}</span>
              ) : (
                t('results.details')
              )}
            </Dialog.Title>
          </div>

          {/* Tabbed Content Area */}
          <Tab.Group>
            <Tab.List className="flex gap-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-4">
              <Tab
                className={({ selected }: { selected: boolean }) =>
                  `${selected
                    ? 'bg-white dark:bg-gray-700 shadow text-primary-700 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-primary-700 dark:hover:text-white'
                  } w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white/60 ring-opacity-60 px-4`
                }
              >
                {t('results.markdown')}
              </Tab>
              <Tab
                className={({ selected }: { selected: boolean }) =>
                  `${selected
                    ? 'bg-white dark:bg-gray-700 shadow text-primary-700 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-primary-700 dark:hover:text-white'
                  } w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white/60 ring-opacity-60 px-4`
                }
              >
                {t('results.json')}
              </Tab>
              {result.attachments && result.attachments.length > 0 && (
                <Tab
                  className={({ selected }: { selected: boolean }) =>
                    `${selected
                      ? 'bg-white dark:bg-gray-700 shadow text-primary-700 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-primary-700 dark:hover:text-white'
                    } w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white/60 ring-opacity-60 px-4`
                  }
                >
                  {t('results.attachments')} ({result.attachments.length})
                </Tab>
              )}
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel className="rounded-xl focus:outline-none">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-[60vh] overflow-y-auto border border-gray-200 dark:border-gray-700 ltr">
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className='text-sm font-mono whitespace-pre-wrap p-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-md shadow-inner overflow-auto ltr'>{(result.result as ResultData)?.markdown || t('results.noContent')}</pre>
                  </div>
                </div>
              </Tab.Panel>
              <Tab.Panel className="rounded-xl focus:outline-none h-[60vh] flex flex-col">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-0 flex-1 flex flex-col max-h-full overflow-hidden border border-gray-200 dark:border-gray-700 ltr">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    defaultValue={JSON.stringify(result, null, 2)}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 13,
                    }}
                    theme="vs-dark"
                  />
                </div>
              </Tab.Panel>
              {result.attachments && result.attachments.length > 0 && (
                <Tab.Panel className="rounded-xl focus:outline-none">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-[60vh] overflow-y-auto border border-gray-200 dark:border-gray-700 ltr">
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
                            className="inline-flex items-center gap-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            <span>{t('common.download')}</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </Tab.Panel>
              )}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </Dialog>
  );
}
