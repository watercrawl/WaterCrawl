import { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { SparklesIcon, XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

import Modal from '../shared/Modal';

import AgentTestBenchSimple from './AgentTestBenchSimple';

import type { Agent, ContextParameters } from '../../types/agent';

interface AgentTestBenchPanelProps {
  agent: Agent | null;
  contextVariableTemplates?: ContextParameters[];
  mode?: 'sidebar' | 'modal' | 'inline';
  defaultOpen?: boolean;
}

const AgentTestBenchPanel: React.FC<AgentTestBenchPanelProps> = ({
  agent,
  contextVariableTemplates = [],
  mode = 'sidebar',
  defaultOpen = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Sidebar mode - toggle visibility
  if (mode === 'sidebar') {
    return (
      <>
        {/* Toggle Button (when closed) */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-x-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            {t('agents.testBench.openChat')}
          </button>
        )}

        {/* Sidebar Panel (when open) */}
        {isOpen && (
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md flex flex-col border-l border-border bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-muted/50 px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                {t('agents.testBench.debugPreview')}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {agent ? (
                <AgentTestBenchSimple agent={agent} contextVariableTemplates={contextVariableTemplates} />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center">
                  <div>
                    <SparklesIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      {t('agents.testBench.configureFirst')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </>
    );
  }

  // Modal mode
  if (mode === 'modal') {
    return (
      <>
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
          {t('agents.testBench.openChat')}
        </button>

        {/* Modal */}
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title={t('agents.testBench.debugPreview')}
          size="2xl"
        >
          {agent ? (
            <div className="h-[600px]">
              <AgentTestBenchSimple agent={agent} contextVariableTemplates={contextVariableTemplates} />
            </div>
          ) : (
            <div className="flex h-96 items-center justify-center text-center">
              <div>
                <SparklesIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                  {t('agents.testBench.configureFirst')}
                </p>
              </div>
            </div>
          )}
        </Modal>
      </>
    );
  }

  // Inline mode (always visible, no wrapper)
  return (
    <>
      {agent ? (
        <AgentTestBenchSimple agent={agent} contextVariableTemplates={contextVariableTemplates} />
      ) : (
        <div className="flex h-full items-center justify-center p-6 text-center">
          <div>
            <SparklesIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              {t('agents.testBench.configureFirst')}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AgentTestBenchPanel;
