import { useTranslation } from 'react-i18next';

import { Tab } from '@headlessui/react';
import {
  ArrowDownTrayIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import Editor from '@monaco-editor/react';

import { useTheme } from '../contexts/ThemeContext';
import { CrawlResult, ResultData } from '../types/crawl';

import { Modal } from './shared/Modal';

interface CrawlResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CrawlResult;
}

export default function CrawlResultModal({ isOpen, onClose, result }: CrawlResultModalProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={result.url || t('results.details')}
      description={
        result.attachments && result.attachments.length > 0
          ? `${result.attachments.length} ${t('results.attachments', { count: result.attachments.length })}`
          : undefined
      }
      icon={DocumentTextIcon}
      size="5xl"
    >
      <Tab.Group>
        <Tab.List className="mb-4 inline-flex rounded-lg border border-border bg-card p-1">
          <Tab
            className={({ selected }: { selected: boolean }) =>
              `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                selected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <DocumentTextIcon className="h-4 w-4" />
            <span>{t('results.markdown')}</span>
          </Tab>
          <Tab
            className={({ selected }: { selected: boolean }) =>
              `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                selected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <CodeBracketIcon className="h-4 w-4" />
            <span>{t('results.json')}</span>
          </Tab>
          {result.attachments && result.attachments.length > 0 && (
            <Tab
              className={({ selected }: { selected: boolean }) =>
                `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  selected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <PaperClipIcon className="h-4 w-4" />
              <span>
                {t('results.attachments')} ({result.attachments.length})
              </span>
            </Tab>
          )}
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel className="focus:outline-none">
            <div className="ltr h-[65vh] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <Editor
                height="100%"
                defaultLanguage="markdown"
                value={(result.result as ResultData)?.markdown || t('results.noContent')}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  wordWrap: 'on',
                  lineNumbers: 'off',
                }}
                theme={isDark ? 'vs-dark' : 'light'}
              />
            </div>
          </Tab.Panel>
          <Tab.Panel className="focus:outline-none">
            <div className="ltr h-[65vh] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={JSON.stringify(result, null, 2)}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  wordWrap: 'on',
                }}
                theme={isDark ? 'vs-dark' : 'light'}
              />
            </div>
          </Tab.Panel>
          {result.attachments && result.attachments.length > 0 && (
            <Tab.Panel className="focus:outline-none">
              <div className="max-h-[65vh] space-y-2 overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-sm">
                {result.attachments.map(attachment => (
                  <div
                    key={attachment.uuid}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-3 transition-all hover:border-primary/30 hover:bg-muted/50"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div className="shrink-0 rounded-md bg-primary/10 p-1.5">
                        <PaperClipIcon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="truncate text-sm font-medium text-foreground">
                        {attachment.filename}
                      </span>
                    </div>
                    <a
                      href={attachment.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-hover"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      <span>{t('common.download')}</span>
                    </a>
                  </div>
                ))}
              </div>
            </Tab.Panel>
          )}
        </Tab.Panels>
      </Tab.Group>
    </Modal>
  );
}
