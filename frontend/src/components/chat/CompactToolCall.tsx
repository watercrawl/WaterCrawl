import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

import CodeBlock from '../shared/CodeBlock';

import { useDirection } from '../../contexts/DirectionContext';


import type { ToolCall } from '../../types/conversation';

interface CompactToolCallProps {
  toolCall: ToolCall;
  isParallel?: boolean;
}

/**
 * Collapsible section for input/output with smooth animation
 */
const CollapsibleSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isRTL?: boolean;
}> = ({ title, icon, children, defaultOpen = false, isRTL = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-2.5 py-1.5 flex items-center gap-2 hover:bg-muted/30 transition-colors ${isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}
      >
        {isOpen ? (
          <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        )}
        {icon}
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
      </button>
      {isOpen && (
        <div className="px-2.5 pb-2 pt-0">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * CompactToolCall - Minimal inline tool call display for chat messages
 * Expandable to show input/output details with collapsible sections
 * Designed to fit naturally within a message card
 */
const CompactToolCall: React.FC<CompactToolCallProps> = ({ toolCall, isParallel = false }) => {
  const { t, i18n } = useTranslation();
  const { direction } = useDirection();
  const isRTL = direction === 'rtl' || ['ar', 'fa', 'he'].includes(i18n.language);
  const [isExpanded, setIsExpanded] = useState(false);

  const isLoading = toolCall.status === 'loading';
  const isCompleted = toolCall.status === 'completed';
  const isError = toolCall.status === 'error';

  const duration = toolCall.completedAt && toolCall.startedAt 
    ? ((toolCall.completedAt - toolCall.startedAt) / 1000).toFixed(1) 
    : null;

  const formatOutput = (output: unknown): string => {
    if (typeof output === 'string') return output;
    return JSON.stringify(output, null, 2);
  };

  return (
    <div className="py-1.5 px-3">
      <div className={`rounded-lg border border-border/40 bg-card overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Collapsed Summary View */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full px-2.5 py-1.5 flex items-center gap-2 hover:bg-muted/30 transition-colors ${isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}
        >
          {isExpanded ? (
            <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          )}

          {/* Status Icon */}
          {isLoading && (
            <div className="h-3.5 w-3.5 flex-shrink-0">
              <svg className="animate-spin h-3.5 w-3.5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
          {isCompleted && <CheckCircleIcon className="h-3.5 w-3.5 text-success flex-shrink-0" />}
          {isError && <ExclamationCircleIcon className="h-3.5 w-3.5 text-destructive flex-shrink-0" />}

          {/* Tool Icon & Name */}
          <WrenchScrewdriverIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">{toolCall.name}</span>

          {/* Badges */}
          <div className={`flex items-center gap-1.5 flex-shrink-0 ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
            {isParallel && (
              <span className="text-xs text-muted-foreground">
                {isRTL ? '•' : '•'} {t('chat.parallel')} {isRTL ? '•' : ''}
              </span>
            )}
            {isLoading && (
              <span className="text-xs text-muted-foreground animate-pulse">
                {t('chat.executing')}
              </span>
            )}
            {duration && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {isRTL ? '•' : '•'} {duration}s {isRTL ? '•' : ''}
              </span>
            )}
          </div>
        </button>

        {/* Expanded Details with collapsible sections */}
        {isExpanded && (
          <div className="divide-y divide-border/30 border-t border-border/30">
            {/* Input Section - Collapsible */}
            <CollapsibleSection
              title={t('chat.toolInput')}
              icon={<span className="text-primary text-[10px]">{isRTL ? '←' : '→'}</span>}
              defaultOpen={true}
              isRTL={isRTL}
            >
              <CodeBlock 
                content={toolCall.input} 
                language="json" 
                maxHeight="max-h-40"
                textSize="xs"
              />
            </CollapsibleSection>

            {/* Output Section - Collapsible */}
            {toolCall.output && (
              <CollapsibleSection
                title={t('chat.toolOutput')}
                icon={<span className="text-success text-[10px]">{isRTL ? '→' : '←'}</span>}
                defaultOpen={true}
                isRTL={isRTL}
              >
                <CodeBlock 
                  content={formatOutput(toolCall.output)} 
                  language="json" 
                  maxHeight="max-h-48"
                  textSize="xs"
                />
              </CollapsibleSection>
            )}

            {/* Error State */}
            {isError && !toolCall.output && (
              <div className={`px-2.5 py-1.5 text-xs text-destructive ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('chat.toolExecutionFailed')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactToolCall;
