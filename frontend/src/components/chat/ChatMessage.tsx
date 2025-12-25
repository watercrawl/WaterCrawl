import React from 'react';

import { useTranslation } from 'react-i18next';

import { UserIcon, CpuChipIcon } from '@heroicons/react/24/outline';

import { useDirection } from '../../contexts/DirectionContext';

import MessageContentRenderer, { extractTextContent, hasDisplayableContent } from './MessageContentRenderer';
import ToolCallRenderer from './ToolCallRenderer';

import type { MessageBlock, ToolCallUIState } from '../../types/conversation';

/**
 * Detect text direction based on first meaningful character
 */
const detectTextDirection = (text: string): 'ltr' | 'rtl' => {
  if (!text) return 'ltr';
  const trimmed = text.trim();
  if (!trimmed) return 'ltr';

  const rtlRanges = [
    /[\u0600-\u06FF]/, // Arabic
    /[\u0750-\u077F]/, // Arabic Supplement
    /[\u0590-\u05FF]/, // Hebrew
    /[\uFB50-\uFDFF]/, // Arabic Presentation Forms-A
    /[\uFE70-\uFEFF]/, // Arabic Presentation Forms-B
  ];

  const firstChar = trimmed.charAt(0);
  for (const range of rtlRanges) {
    if (range.test(firstChar)) {
      return 'rtl';
    }
  }
  return 'ltr';
};

interface ChatMessageProps {
  /** The message block to render */
  messageBlock: MessageBlock;
  /** Whether this message is currently streaming */
  isStreaming?: boolean;
}

/**
 * ChatMessage component - Renders a single MessageBlock
 * Simply displays the content based on the block structure
 * No state management - just pure rendering
 */
const ChatMessage: React.FC<ChatMessageProps> = ({ messageBlock, isStreaming = false }) => {
  const { t, i18n } = useTranslation();
  const { direction } = useDirection();
  const isRTL = direction === 'rtl' || ['ar', 'fa', 'he'].includes(i18n.language);
  
  const isUser = messageBlock.role === 'user';
  const isAssistant = messageBlock.role === 'assistant';


  // Detect parallel tool calls (consecutive tool calls in same AI message)
  const getParallelToolIds = (): Set<string> => {
    const ids = new Set<string>();
    for (const message of messageBlock.messages) {
      if (message.message_type === 'ai' && message.tool_calls.length > 1) {
        message.tool_calls.forEach(tc => ids.add(tc.id));
      }
    }
    return ids;
  };
  const parallelToolIds = getParallelToolIds();

  // Convert a tool call to UI state
  const getToolCallUIState = (toolCallId: string, toolName: string, args: Record<string, any>): ToolCallUIState => {
    // Find matching tool result by tool_call_id
    const toolResult = messageBlock.messages.find(
      m => m.message_type === 'tool' && m.tool_call_id === toolCallId
    );

    return {
      id: toolCallId,
      name: toolName,
      input: args,
      output: toolResult?.content,
      status: toolResult ? 'completed' : 'loading',
      startedAt: Date.now(),
      completedAt: toolResult ? Date.now() : undefined,
    };
  };

  // Determine message alignment based on role and UI direction
  const messageAlignment = isUser 
    ? (isRTL ? 'flex-row' : 'flex-row-reverse')
    : (isRTL ? 'flex-row-reverse' : 'flex-row');

  // Check if there's any content in the block (for streaming cursor placement)
  const hasContent = messageBlock.messages.some(
    m => (m.message_type === 'ai' || m.message_type === 'human') && hasDisplayableContent(m.content)
  );

  return (
    <div className={`flex gap-3 ${messageAlignment} mb-4`}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
          {isAssistant ? <CpuChipIcon className="h-4 w-4 text-primary" /> : <UserIcon className="h-4 w-4 text-secondary" />}
        </div>
      </div>

      {/* Message Content */}
      <div className={`max-w-[85%] ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="rounded-2xl bg-card border border-border text-foreground overflow-hidden">
          {messageBlock.messages.map((message) => {
            // Render AI messages
            if (message.message_type === 'ai' || message.message_type === 'human') {
              const textContent = extractTextContent(message.content);
              const textDir = detectTextDirection(textContent);
              
              return (
                <React.Fragment key={message.uuid}>
                  {/* Content */}
                  {hasDisplayableContent(message.content) && (
                    <div className="px-4 py-3" dir={textDir}>
                      <MessageContentRenderer content={message.content} textDirection={textDir} />
                    </div>
                  )}

                  {/* Tool calls */}
                  {message.tool_calls.map((toolCall) => {
                    const toolCallState = getToolCallUIState(toolCall.id, toolCall.name, toolCall.args);
                    
                    return (
                      <ToolCallRenderer
                        key={toolCall.id}
                        toolCall={toolCallState}
                        isParallel={parallelToolIds.has(toolCall.id)}
                      />
                    );
                  })}
                </React.Fragment>
              );
            }

            // Tool messages are handled via tool_calls above
            return null;
          })}
          
          {/* Thinking indicator - when streaming but no content yet */}
          {isStreaming && isAssistant && !hasContent && (
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-dot-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-dot-bounce" style={{ animationDelay: '200ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-dot-bounce" style={{ animationDelay: '400ms' }} />
                </div>
                <span>{t('chat.thinking')}</span>
              </div>
            </div>
          )}
          
          {/* Streaming indicator - at the end of the message block */}
          {isStreaming && isAssistant && hasContent && (
            <div className="px-4 py-2">
              <div className="text-sm inline-flex items-center gap-1 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-dot-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-dot-bounce" style={{ animationDelay: '200ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-dot-bounce" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
