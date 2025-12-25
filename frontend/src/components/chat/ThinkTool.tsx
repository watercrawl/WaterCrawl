import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { 
  ChevronDownIcon,
  ChevronRightIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

import { useDirection } from '../../contexts/DirectionContext';

import type { ToolCallUIState } from '../../types/conversation';

interface ThinkToolProps {
  toolCall: ToolCallUIState;
}

/**
 * ThinkTool component - Displays the reflection/thinking output from the think tool
 * Only shows output (reflection), not input
 * Expandable: shows summary when collapsed, full reflection when expanded
 */
const ThinkTool: React.FC<ThinkToolProps> = ({ toolCall }) => {
  const { t, i18n } = useTranslation();
  const { direction } = useDirection();
  const isRTL = direction === 'rtl' || ['ar', 'fa', 'he'].includes(i18n.language);
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract reflection content from output
  const getReflection = (): string | null => {
    if (!toolCall.output) return null;

    // If output is an object with content property
    if (typeof toolCall.output === 'object' && 'content' in toolCall.output) {
      const content = (toolCall.output as { content?: string }).content;
      if (typeof content === 'string') {
        return content;
      }
    }

    // If output is a string, try to parse it
    if (typeof toolCall.output === 'string') {
      try {
        const parsed = JSON.parse(toolCall.output);
        if (parsed && typeof parsed === 'object' && 'content' in parsed && typeof parsed.content === 'string') {
          return parsed.content;
        }
      } catch (_e) {
        // Not valid JSON, use as-is
        return toolCall.output;
      }
    }

    return null;
  };

  const reflection = getReflection();

  if (!reflection) {
    return null;
  }

  // Truncate reflection for summary (first 100 characters)
  const summary = reflection.length > 100 
    ? `${reflection.substring(0, 100)}...` 
    : reflection;

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
          <LightBulbIcon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span className="text-xs font-medium text-foreground">
            {t('chat.thinking')}
          </span>
          {!isExpanded && (
            <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
              {summary}
            </span>
          )}
        </button>

        {/* Expanded Reflection View */}
        {isExpanded && (
          <div className="px-2.5 py-1.5 border-t border-border/30">
            <div className={`text-xs text-foreground whitespace-pre-wrap break-words ${isRTL ? 'text-right' : 'text-left'}`}>
              {reflection}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThinkTool;
