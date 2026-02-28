import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { ChevronDownIcon, ChevronRightIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

import Loading from '../shared/Loading';

import type { ToolCall } from '../../types/conversation';


interface ToolCallCardProps {
  toolCall: ToolCall;
  isParallel?: boolean;
}

/**
 * ToolCallCard component displays a tool call with expandable input/output details
 * Shows loading state while tool is executing
 * Supports parallel tool calling visualization
 */
const ToolCallCard: React.FC<ToolCallCardProps> = ({ toolCall, isParallel = false }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const isLoading = toolCall.status === 'loading';
  const isCompleted = toolCall.status === 'completed';
  const isError = toolCall.status === 'error';

  const duration = toolCall.completedAt && toolCall.startedAt 
    ? ((toolCall.completedAt - toolCall.startedAt) / 1000).toFixed(2) 
    : null;

  return (
    <div className={`rounded-lg border transition-all duration-200 ${
      isError 
        ? 'border-destructive bg-destructive/5' 
        : isCompleted
          ? 'border-success bg-success-soft'
          : 'border-border bg-card'
    }`}>
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={isLoading && !toolCall.input}
        className="w-full px-4 py-3 flex items-center gap-3 text-start hover:bg-muted/50 transition-colors disabled:cursor-not-allowed"
      >
        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Status Icon */}
        <div className="flex-shrink-0">
          {isLoading && <Loading size="sm" />}
          {isCompleted && <CheckCircleIcon className="h-5 w-5 text-success" />}
          {isError && (
            <div className="h-5 w-5 rounded-full bg-destructive flex items-center justify-center">
              <span className="text-xs text-destructive-foreground">!</span>
            </div>
          )}
        </div>

        {/* Tool Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground text-sm">
              {toolCall.name}
            </span>
            
            {isParallel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-info-soft text-info">
                {t('chat.parallel')}
              </span>
            )}
            
            {isLoading && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                <ClockIcon className="h-3 w-3" />
                {t('chat.executing')}
              </span>
            )}
            
            {duration && (
              <span className="text-xs text-muted-foreground">
                {duration}s
              </span>
            )}
          </div>
          
          {!isExpanded && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {t('chat.clickToViewDetails')}
            </p>
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border px-4 py-3 space-y-4">
          {/* Input Section */}
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-primary text-xs">
                →
              </span>
              {t('chat.toolInput')}
            </h4>
            <div className="bg-muted/50 rounded-md p-3 overflow-x-auto">
              <pre className="text-xs text-foreground font-mono whitespace-pre-wrap break-words">
                {JSON.stringify(toolCall.input, null, 2)}
              </pre>
            </div>
          </div>

          {/* Output Section */}
          {toolCall.output && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-success/10 text-success text-xs">
                  ←
                </span>
                {t('chat.toolOutput')}
              </h4>
              <div className="bg-muted/50 rounded-md p-3 overflow-x-auto max-h-96 overflow-y-auto">
                <pre className="text-xs text-foreground font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(toolCall.output, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Error Message */}
          {isError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-sm text-destructive font-medium">
                {t('chat.toolExecutionFailed')}
              </p>
            </div>
          )}

          {/* Run ID (for debugging) */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">{t('chat.runId')}:</span> {toolCall.id}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolCallCard;
