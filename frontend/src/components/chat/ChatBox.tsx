import React, { useState, useRef, useEffect, useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import { CpuChipIcon, BoltIcon, BoltSlashIcon } from '@heroicons/react/24/outline';
import { PaperAirplaneIcon, StopCircleIcon } from '@heroicons/react/24/solid';

import { useDirection } from '../../contexts/DirectionContext';

import ChatMessage from './ChatMessage';
import ErrorMessage from './ErrorMessage';
import FileAttachment from './FileAttachment';

import type { FileAttachmentItem } from './FileAttachment';
import type { 
  MessageBlock, 
  ChatMessage as ChatMessageType,
  ChatEvent,
  ToolCallDefinition,
  ContentPart,
  MessageContent,
} from '../../types/conversation';

/**
 * Detect text direction based on first meaningful character
 */
export const detectTextDirection = (text: string): 'ltr' | 'rtl' => {
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

/**
 * Create a user MessageBlock from user input
 * @param text - The text content of the message
 * @param conversationId - The conversation ID
 * @param attachments - Optional file attachments to include
 */
export const createUserMessageBlock = (
  text: string, 
  conversationId: string,
  attachments?: FileAttachmentItem[]
): MessageBlock => {
  const now = new Date().toISOString();
  const uuid = `user-${Date.now()}`;
  
  // Build content: either simple string or array with text + attachments
  let content: MessageContent = text;
  
  if (attachments && attachments.length > 0) {
    const contentParts: ContentPart[] = [];
    
    // Add text content first if present
    if (text.trim()) {
      contentParts.push({
        type: 'text',
        text: text,
      });
    }
    
    // Add attachments
    for (const attachment of attachments) {
      if (attachment.preview && attachment.file.type.startsWith('image/')) {
        // For images, we need to convert the blob URL to base64
        // Since we have the preview URL, we'll store the file info
        // The actual display will use the preview URL
        contentParts.push({
          type: 'image',
          source: {
            type: 'url',
            media_type: attachment.file.type,
            data: attachment.preview,
          },
        });
      } else {
        // For other files
        contentParts.push({
          type: 'file',
          source: {
            type: 'url',
            media_type: attachment.file.type,
            data: attachment.preview || '',
            filename: attachment.file.name,
          },
        });
      }
    }
    
    content = contentParts;
  }
  
  return {
    uuid,
    role: 'user',
    conversation_id: conversationId,
    messages: [{
      uuid: `msg-${Date.now()}`,
      name: null,
      message_type: 'human',
      content,
      tool_calls: [],
      additional_kwargs: {},
      response_metadata: {},
      created_at: now,
    }],
  };
};

// ============================================
// Streaming Message Block Builder
// ============================================

/**
 * State for building a MessageBlock from streaming events
 * This is accumulated as events come in
 */
export interface StreamingState {
  conversationId: string;
  blockId: string;
  currentAiMessageId: string | null;
  currentContent: string;
  currentToolCalls: Map<string, ToolCallDefinition & { output?: string }>;
  messages: ChatMessageType[];
  error: { message: string; code?: string | number } | null;
}

/**
 * Create initial streaming state
 */
export const createStreamingState = (): StreamingState => ({
  conversationId: '',
  blockId: '',
  currentAiMessageId: null,
  currentContent: '',
  currentToolCalls: new Map(),
  messages: [],
  error: null,
});

/**
 * Process a streaming event and update the streaming state
 * Returns the updated state (immutable)
 * 
 * @param state - Current streaming state
 * @param event - The streaming event to process
 * @returns Updated streaming state
 */
export const processStreamingEvent = (
  state: StreamingState,
  event: ChatEvent
): StreamingState => {
  const newState = { ...state };
  
  switch (event.event) {
    case 'conversation':
      // Store conversation ID
      newState.conversationId = event.data.id;
      break;
      
    case 'assistant-message':
      // Start of assistant message block
      newState.blockId = event.data.id;
      break;
      
    case 'chat_model_start':
      // New AI message started - flush any previous content
      if (newState.currentContent || newState.currentToolCalls.size > 0) {
        // Create message from accumulated content and tool calls
        const message = createAiMessage(
          newState.currentAiMessageId || event.data.run_id,
          newState.currentContent,
          Array.from(newState.currentToolCalls.values())
        );
        newState.messages = [...newState.messages, message];
        
        // Add tool result messages
        for (const toolCall of newState.currentToolCalls.values()) {
          if (toolCall.output !== undefined) {
            const toolMessage = createToolMessage(toolCall);
            newState.messages = [...newState.messages, toolMessage];
          }
        }
        
        newState.currentContent = '';
        newState.currentToolCalls = new Map();
      }
      newState.currentAiMessageId = event.data.run_id;
      break;
      
    case 'content':
      // Append streaming content
      newState.currentContent += event.data.text;
      break;
      
    case 'tool_call_start':
      // Start a tool call
      newState.currentToolCalls = new Map(newState.currentToolCalls);
      newState.currentToolCalls.set(event.data.run_id, {
        id: event.data.run_id,
        name: event.data.name,
        args: event.data.input,
        type: 'tool_call',
      });
      break;
      
    case 'tool_call_end': {
      // Complete a tool call with output
      newState.currentToolCalls = new Map(newState.currentToolCalls);
      const existingToolCall = newState.currentToolCalls.get(event.data.run_id);
      if (existingToolCall) {
        // Preserve the output structure - it might be an object (for write_todos) or have a content property
        let output: any;
        if (event.data.output && typeof event.data.output === 'object') {
          // If output has a content property, use it (for most tools)
          // Otherwise, use the output object itself (for write_todos)
          if ('content' in event.data.output && typeof event.data.output.content !== 'object') {
            output = String(event.data.output.content) || '';
          } else {
            // Use the output object directly (for write_todos and similar)
            output = event.data.output;
          }
        } else {
          output = String(event.data.output) || '';
        }
        
        newState.currentToolCalls.set(event.data.run_id, {
          ...existingToolCall,
          output
        });
      }
      break;
    }
      
    case 'error': {
      // Handle error event - extract error message from data
      // Note: Fallback message will be translated at component level
      const errorMessage = (event.data as any).error || (event.data as any).message || 'An error occurred';
      const errorCode = (event.data as any).code;
      newState.error = {
        message: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
        code: errorCode,
      };
      break;
    }
      
    case 'done':
      // Finalize - flush remaining content
      // This is handled by buildMessageBlockFromState
      break;
  }
  
  return newState;
};

/**
 * Create an AI ChatMessage from accumulated content and tool calls
 */
const createAiMessage = (
  uuid: string,
  content: string,
  toolCalls: Array<ToolCallDefinition & { output?: string }>
): ChatMessageType => ({
  uuid,
  name: null,
  message_type: 'ai',
  content,
  tool_calls: toolCalls.map(tc => ({
    id: tc.id,
    name: tc.name,
    args: tc.args,
    type: 'tool_call' as const,
  })),
  additional_kwargs: {},
  response_metadata: {},
  created_at: new Date().toISOString(),
});

/**
 * Create a tool result ChatMessage
 */
const createToolMessage = (
  toolCall: ToolCallDefinition & { output?: string }
): ChatMessageType => ({
  uuid: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: toolCall.name,
  message_type: 'tool',
  content: toolCall.output || '',
  tool_calls: [],
  tool_call_id: toolCall.id, // Link to the tool call
  additional_kwargs: {},
  response_metadata: {},
  created_at: new Date().toISOString(),
});

/**
 * Build a final MessageBlock from streaming state
 * Call this when streaming is complete (after 'done' event)
 */
export const buildMessageBlockFromState = (state: StreamingState): MessageBlock => {
  const messages = [...state.messages];
  
  // Flush any remaining content/tool calls
  if (state.currentContent || state.currentToolCalls.size > 0) {
    const aiMessage = createAiMessage(
      state.currentAiMessageId || `ai-${Date.now()}`,
      state.currentContent,
      Array.from(state.currentToolCalls.values())
    );
    messages.push(aiMessage);
    
    // Add tool result messages
    for (const toolCall of state.currentToolCalls.values()) {
      if (toolCall.output !== undefined) {
        messages.push(createToolMessage(toolCall));
      }
    }
  }
  
  return {
    uuid: state.blockId || `block-${Date.now()}`,
    role: 'assistant',
    conversation_id: state.conversationId,
    messages,
  };
};

/**
 * Build a "live" MessageBlock from current streaming state
 * Used to show real-time updates during streaming
 */
export const buildLiveMessageBlock = (state: StreamingState): MessageBlock => {
  const messages = [...state.messages];
  
  // Add current in-progress message if there's content or tool calls
  if (state.currentContent || state.currentToolCalls.size > 0) {
    const aiMessage = createAiMessage(
      state.currentAiMessageId || `ai-live-${Date.now()}`,
      state.currentContent,
      Array.from(state.currentToolCalls.values())
    );
    messages.push(aiMessage);
    
    // Add tool result messages for completed tool calls
    for (const toolCall of state.currentToolCalls.values()) {
      if (toolCall.output !== undefined) {
        messages.push(createToolMessage(toolCall));
      }
    }
  }
  
  return {
    uuid: state.blockId || `block-live-${Date.now()}`,
    role: 'assistant',
    conversation_id: state.conversationId,
    messages,
  };
};

// ============================================
// ChatBox Component
// ============================================

interface ChatBoxProps {
  /** Callback for blocking mode - returns the assistant's MessageBlock */
  onSendMessage: (query: string, fileUuids?: string[]) => Promise<MessageBlock>;
  /** Callback for streaming mode - calls onEvent for each event */
  onSendMessageStreaming?: (
    query: string,
    onEvent: (event: ChatEvent) => void,
    onEnd: () => void,
    fileUuids?: string[]
  ) => Promise<void>;
  /** Initial message blocks to display */
  initialMessageBlocks?: MessageBlock[];
  /** Placeholder text for input */
  placeholder?: string;
  /** Disable input */
  disabled?: boolean;
  /** Show streaming mode toggle (only if onSendMessageStreaming is provided) */
  showStreamingToggle?: boolean;
  /** Default mode */
  defaultStreamingMode?: boolean;
  /** Enable file attachments */
  enableFileAttachments?: boolean;
  /** Maximum number of file attachments */
  maxFileAttachments?: number;
}

/**
 * ChatBox component - Chat interface with blocking and streaming support
 * 
 * - Stores MessageBlock[] state
 * - Creates user MessageBlock when sending
 * - Blocking mode: receives complete MessageBlock from API
 * - Streaming mode: builds MessageBlock from events in real-time
 * - Shows loading/streaming placeholder while waiting
 */
const ChatBox: React.FC<ChatBoxProps> = ({
  onSendMessage,
  onSendMessageStreaming,
  initialMessageBlocks = [],
  placeholder,
  disabled = false,
  showStreamingToggle = true,
  defaultStreamingMode = false,
  enableFileAttachments = true,
  maxFileAttachments = 5,
}) => {
  const { t, i18n } = useTranslation();
  const { direction } = useDirection();
  const isRTL = direction === 'rtl' || ['ar', 'fa', 'he'].includes(i18n.language);
  const [messageBlocks, setMessageBlocks] = useState<MessageBlock[]>(initialMessageBlocks);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMode, setStreamingMode] = useState(defaultStreamingMode && !!onSendMessageStreaming);
  const [conversationId, setConversationId] = useState<string>('');
  const [error, setError] = useState<{ message: string; code?: string | number } | null>(null);
  const [attachments, setAttachments] = useState<FileAttachmentItem[]>([]);
  
  // Streaming state - kept in ref for real-time updates without re-renders
  const streamingStateRef = useRef<StreamingState>(createStreamingState());
  const [liveMessageBlock, setLiveMessageBlock] = useState<MessageBlock | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageBlocks, isLoading, liveMessageBlock, error]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  /**
   * Handle streaming event - processes event and updates live message block
   * This function can be modified to change how events are processed
   */
  const handleStreamingEvent = useCallback((event: ChatEvent) => {
    console.log('Streaming event:', event);
    
    // Process the event and update streaming state
    streamingStateRef.current = processStreamingEvent(streamingStateRef.current, event);
    
    // Update conversation ID if received
    if (event.event === 'conversation' && event.data.id) {
      setConversationId(event.data.id);
    }
    
    // Update error state if error event
    if (event.event === 'error') {
      const error = streamingStateRef.current.error;
      if (error) {
        // Translate fallback error message if it's the default
        const translatedMessage = error.message === 'An error occurred' 
          ? t('chat.errorOccurred')
          : error.message;
        setError({
          ...error,
          message: translatedMessage,
        });
      }
    }
    
    // Build and update the live message block for display
    const liveBlock = buildLiveMessageBlock(streamingStateRef.current);
    setLiveMessageBlock(liveBlock);
  }, [t]);

  /**
   * Handle streaming end - finalizes the message block
   */
  const handleStreamingEnd = useCallback(() => {
    console.log('Streaming ended');
    
    // If there's an error, it's already displayed, just reset
    if (streamingStateRef.current.error) {
      // Error is already set in state, keep it visible
      streamingStateRef.current = createStreamingState();
      setLiveMessageBlock(null);
      setIsStreaming(false);
      abortControllerRef.current = null;
      return;
    }
    
    // Build final message block from accumulated state
    const finalBlock = buildMessageBlockFromState(streamingStateRef.current);
    
    // Add to message blocks
    if (finalBlock.messages.length > 0) {
      setMessageBlocks(prev => [...prev, finalBlock]);
    }
    
    // Reset streaming state
    streamingStateRef.current = createStreamingState();
    setLiveMessageBlock(null);
    setIsStreaming(false);
    abortControllerRef.current = null;
    setError(null);
  }, []);

  /**
   * Get file UUIDs from uploaded attachments
   */
  const getUploadedFileUuids = (): string[] => {
    return attachments
      .filter((a) => a.uploaded && a.media)
      .map((a) => a.media!.uuid);
  };

  /**
   * Clear attachments after sending
   */
  const clearAttachments = () => {
    // Revoke preview URLs
    attachments.forEach((a) => {
      if (a.preview) {
        URL.revokeObjectURL(a.preview);
      }
    });
    setAttachments([]);
  };

  /**
   * Check if there are pending uploads
   */
  const hasPendingUploads = attachments.some((a) => a.uploading);

  /**
   * Handle blocking mode submit
   */
  const handleBlockingSubmit = async (query: string, fileUuids?: string[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const assistantBlock = await onSendMessage(query, fileUuids);
      console.log('Blocking response:', assistantBlock);
      
      // Check if response indicates an error
      if ((assistantBlock as any).code && (assistantBlock as any).message) {
        setError({
          message: (assistantBlock as any).message,
          code: (assistantBlock as any).code,
        });
        setIsLoading(false);
        return;
      }
      
      // Update conversation ID
      if (assistantBlock.conversation_id) {
        setConversationId(assistantBlock.conversation_id);
      }
      
      setMessageBlocks(prev => [...prev, assistantBlock]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Extract error message from various error formats
      const errorMessage = error?.message || error?.response?.data?.message || error?.response?.data?.error || t('chat.errorOccurred');
      const errorCode = error?.code || error?.response?.status || error?.response?.data?.code;
      setError({
        message: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
        code: errorCode,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle streaming mode submit
   */
  const handleStreamingSubmit = async (query: string, fileUuids?: string[]) => {
    if (!onSendMessageStreaming) {
      // Fallback to blocking if streaming not available
      return handleBlockingSubmit(query, fileUuids);
    }
    
    setIsStreaming(true);
    setError(null);
    streamingStateRef.current = createStreamingState();
    abortControllerRef.current = new AbortController();
    
    try {
      await onSendMessageStreaming(query, handleStreamingEvent, handleStreamingEnd, fileUuids);
    } catch (error: any) {
      console.error('Error in streaming:', error);
      const errorMessage = error?.message || error?.response?.data?.message || error?.response?.data?.error || t('chat.errorOccurred');
      const errorCode = error?.code || error?.response?.status || error?.response?.data?.code;
      setError({
        message: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
        code: errorCode,
      });
      handleStreamingEnd();
    }
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading || isStreaming || disabled || hasPendingUploads) return;

    const query = inputValue.trim();
    const fileUuids = getUploadedFileUuids();
    
    // Get uploaded attachments before clearing (for display in message)
    const uploadedAttachments = attachments.filter(a => a.uploaded);
    
    // Create and add user message block (include attachments for display)
    const userBlock = createUserMessageBlock(query, conversationId, uploadedAttachments);
    setMessageBlocks(prev => [...prev, userBlock]);
    setInputValue('');
    setError(null);
    clearAttachments();

    // Choose mode
    if (streamingMode && onSendMessageStreaming) {
      await handleStreamingSubmit(query, fileUuids.length > 0 ? fileUuids : undefined);
    } else {
      await handleBlockingSubmit(query, fileUuids.length > 0 ? fileUuids : undefined);
    }
  };

  /**
   * Handle stop button click
   */
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    handleStreamingEnd();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // Can toggle streaming mode?
  const canToggleStreaming = showStreamingToggle && !!onSendMessageStreaming;

  const isProcessing = isLoading || isStreaming;

  return (
    <div className={`flex flex-col h-full bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Streaming Mode Toggle */}
      {canToggleStreaming && (
        <div className={`border-b border-border bg-card px-4 py-2 flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between`}>
          <span className="text-xs text-muted-foreground">
            {t('chat.responseMode')}
          </span>
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setStreamingMode(false)}
              disabled={isProcessing}
              className={`relative inline-flex items-center gap-x-1.5 ${isRTL ? 'rounded-r-md' : 'rounded-l-md'} px-3 py-1.5 text-xs font-medium transition-colors ${
                !streamingMode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground ring-1 ring-inset ring-border hover:bg-muted'
              } disabled:opacity-50`}
            >
              <BoltSlashIcon className="h-3.5 w-3.5" />
              {t('chat.blocking')}
            </button>
            <button
              type="button"
              onClick={() => setStreamingMode(true)}
              disabled={isProcessing}
              className={`relative ${isRTL ? '-mr-px' : '-ml-px'} inline-flex items-center gap-x-1.5 ${isRTL ? 'rounded-l-md' : 'rounded-r-md'} px-3 py-1.5 text-xs font-medium transition-colors ${
                streamingMode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground ring-1 ring-inset ring-border hover:bg-muted'
              } disabled:opacity-50`}
            >
              <BoltIcon className="h-3.5 w-3.5" />
              {t('chat.streaming')}
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* Empty state */}
        {messageBlocks.length === 0 && !isProcessing && !liveMessageBlock && !error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <CpuChipIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t('chat.startConversation')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('chat.askAnything')}
              </p>
            </div>
          </div>
        )}

        {/* Message blocks */}
        {messageBlocks.map((block) => (
          <ChatMessage
            key={block.uuid}
            messageBlock={block}
          />
        ))}

        {/* Live streaming message */}
        {isStreaming && liveMessageBlock && liveMessageBlock.messages.length > 0 && (
          <ChatMessage
            key="live-streaming"
            messageBlock={liveMessageBlock}
            isStreaming={true}
          />
        )}

        {/* Error message */}
        {error && (
          <ErrorMessage
            error={error.message}
            code={error.code}
          />
        )}

        {/* Loading placeholder (blocking mode) */}
        {isLoading && (
          <div className={`flex gap-3 ${isRTL ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className="flex-shrink-0 mt-1">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                <CpuChipIcon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="rounded-2xl bg-card border border-border text-foreground overflow-hidden">
              <div className="px-4 py-3">
                <div className={`flex items-center gap-2 text-muted-foreground ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs">{t('chat.thinking')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Streaming initial placeholder (before first content) */}
        {isStreaming && (!liveMessageBlock || liveMessageBlock.messages.length === 0) && (
          <div className={`flex gap-3 ${isRTL ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className="flex-shrink-0 mt-1">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                <CpuChipIcon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="rounded-2xl bg-card border border-border text-foreground overflow-hidden">
              <div className="px-4 py-3">
                <div className={`flex items-center gap-2 text-muted-foreground ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs">{t('chat.streaming')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card px-4 py-4">
        {/* File attachments preview */}
        {enableFileAttachments && attachments.length > 0 && (
          <div className="mb-3">
            <FileAttachment
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              disabled={disabled || isProcessing}
              maxFiles={maxFileAttachments}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className={`flex items-end gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* File attachment button */}
          {enableFileAttachments && attachments.length === 0 && (
            <FileAttachment
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              disabled={disabled || isProcessing}
              maxFiles={maxFileAttachments}
            />
          )}

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || t('chat.typeMessage')}
              disabled={disabled || isProcessing}
              rows={1}
              dir={detectTextDirection(inputValue) || (isRTL ? 'rtl' : 'ltr')}
              className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed max-h-32 overflow-y-auto transition-all"
              style={{ minHeight: '44px' }}
            />
          </div>

          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              className="inline-flex items-center justify-center h-11 w-11 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex-shrink-0"
              title={t('common.stop')}
            >
              <StopCircleIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputValue.trim() || disabled || isProcessing || hasPendingUploads}
              className="inline-flex items-center justify-center h-11 w-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title={t('common.send')}
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          )}
        </form>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          {t('chat.pressEnter')}
        </p>
      </div>
    </div>
  );
};

export default ChatBox;
