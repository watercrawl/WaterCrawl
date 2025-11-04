import { useTranslation } from 'react-i18next';
import { Dialog } from '@headlessui/react';
import { Tab } from '@headlessui/react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Editor from '@monaco-editor/react';
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
      <div className="fixed inset-0 bg-muted/75" />
      <div className="relative mx-auto max-w-4xl">
        <div className="w-full transform overflow-hidden rounded-2xl bg-card p-6 text-start align-middle shadow-xl transition-all">
          <div className="absolute end-0 top-0 pe-4 pt-4">
            <button
              onClick={onClose}
              className="rounded-md bg-card text-muted-foreground hover:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Title Box with URL */}
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-foreground">
              {result.url ? (
                <span className="block max-w-lg truncate" title={result.url}>
                  {result.url}
                </span>
              ) : (
                t('results.details')
              )}
            </Dialog.Title>
          </div>

          {/* Tabbed Content Area */}
          <Tab.Group>
            <Tab.List className="mb-4 flex gap-x-1 rounded-xl bg-muted p-1">
              <Tab
                className={({ selected }: { selected: boolean }) =>
                  `${
                    selected
                      ? 'bg-card text-primary-dark shadow'
                      : 'text-muted-foreground hover:bg-card/[0.12] hover:text-primary-dark'
                  } w-full rounded-lg px-4 py-2.5 text-sm font-medium leading-5 ring-white/60 ring-opacity-60 ring-offset-2 ring-offset-primary-400 transition-colors focus:outline-none focus:ring-2`
                }
              >
                {t('results.markdown')}
              </Tab>
              <Tab
                className={({ selected }: { selected: boolean }) =>
                  `${
                    selected
                      ? 'bg-card text-primary-dark shadow'
                      : 'text-muted-foreground hover:bg-card/[0.12] hover:text-primary-dark'
                  } w-full rounded-lg px-4 py-2.5 text-sm font-medium leading-5 ring-white/60 ring-opacity-60 ring-offset-2 ring-offset-primary-400 transition-colors focus:outline-none focus:ring-2`
                }
              >
                {t('results.json')}
              </Tab>
              {result.attachments && result.attachments.length > 0 && (
                <Tab
                  className={({ selected }: { selected: boolean }) =>
                    `${
                      selected
                        ? 'bg-card text-primary-dark shadow'
                        : 'text-muted-foreground hover:bg-card/[0.12] hover:text-primary-dark'
                    } w-full rounded-lg px-4 py-2.5 text-sm font-medium leading-5 ring-white/60 ring-opacity-60 ring-offset-2 ring-offset-primary-400 transition-colors focus:outline-none focus:ring-2`
                  }
                >
                  {t('results.attachments')} ({result.attachments.length})
                </Tab>
              )}
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel className="rounded-xl focus:outline-none">
                <div className="ltr max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-muted p-4">
                  <div className="prose max-w-none">
                    <pre className="ltr overflow-auto whitespace-pre-wrap rounded-md bg-card p-4 font-mono text-sm text-foreground shadow-inner">
                      {(result.result as ResultData)?.markdown || t('results.noContent')}
                    </pre>
                  </div>
                </div>
              </Tab.Panel>
              <Tab.Panel className="flex h-[60vh] flex-col rounded-xl focus:outline-none">
                <div className="ltr flex max-h-full flex-1 flex-col overflow-hidden rounded-lg border border-border bg-muted p-0">
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
                  <div className="ltr max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-muted p-4">
                    <div className="space-y-3">
                      {result.attachments.map(attachment => (
                        <div
                          key={attachment.uuid}
                          className="flex items-center justify-between rounded-lg bg-muted p-4 transition-colors hover:bg-muted"
                        >
                          <div className="text-sm text-foreground">{attachment.filename}</div>
                          <a
                            href={attachment.attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-x-2 text-sm text-primary transition-colors hover:text-primary-dark"
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
