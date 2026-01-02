import { useState, useMemo, useEffect } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import {
  ArrowPathIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

import ChatBox from '../chat/ChatBox';

import { agentApi } from '../../services/api/agent';

import type { Agent } from '../../types/agent';
import type { MessageBlock, ChatEvent } from '../../types/conversation';

interface AgentChatInterfaceProps {
  agent: Agent;
  isPublished: boolean;
  onConversationCreated?: (conversationId: string, title?: string) => void;
  /** Whether structured JSON output is enabled for this agent */
  jsonOutput?: boolean;
  /** Predefined JSON schema for output (null means dynamic mode when jsonOutput is true) */
  jsonSchema?: Record<string, unknown> | null;
}

const AgentChatInterface: React.FC<AgentChatInterfaceProps> = ({
  agent,
  isPublished,
  onConversationCreated,
  jsonOutput = false,
  jsonSchema = null,
}) => {
  const { t } = useTranslation();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const [streamingMode, setStreamingMode] = useState(true); // Preserve streaming mode across new chats
  const [_conversationTitle, setConversationTitle] = useState<string | null>(null);
  const [outputSchemaText, setOutputSchemaText] = useState<string>('');
  const [outputSchemaError, setOutputSchemaError] = useState<string | null>(null);
  const [showSchemaInput, setShowSchemaInput] = useState(false);

  // Determine if we're in dynamic schema mode
  const isDynamicSchemaMode = jsonOutput && !jsonSchema;

  // Parse output schema from text input
  const parsedOutputSchema = useMemo(() => {
    if (!outputSchemaText.trim()) return null;
    try {
      const parsed = JSON.parse(outputSchemaText);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }, [outputSchemaText]);

  // Auto-expand schema input in dynamic mode
  useEffect(() => {
    if (isDynamicSchemaMode) {
      setShowSchemaInput(true);
    }
  }, [isDynamicSchemaMode]);

  const handleOutputSchemaChange = (text: string) => {
    setOutputSchemaText(text);
    setOutputSchemaError(null);

    if (text.trim()) {
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed !== 'object' || parsed === null) {
          setOutputSchemaError(t('agents.jsonOutput.invalidSchema'));
        }
      } catch {
        setOutputSchemaError(t('agents.jsonOutput.invalidJson'));
      }
    }
  };

  const handleNewChat = () => {
    setConversationId(null);
    setConversationTitle(null);
    setChatKey(prev => prev + 1);
    toast.success(t('agents.testBench.newChatStarted'));
  };

  /**
   * Send message to agent (blocking mode) - returns the response MessageBlock
   */
  const handleSendMessage = async (query: string): Promise<MessageBlock> => {
    // For dynamic schema mode, validate that output_schema is provided
    if (isDynamicSchemaMode && !parsedOutputSchema) {
      toast.error(t('agents.testBench.outputSchemaRequired'));
      throw new Error('output_schema is required in dynamic schema mode');
    }

    try {
      const response = await agentApi.chatWithPublishedBlocking(
        agent.uuid,
        {
          query,
          user: 'user',
          inputs: {},
          conversation_id: conversationId || undefined,
          output_schema: isDynamicSchemaMode ? parsedOutputSchema : undefined,
        }
      );

      // Store conversation ID for follow-up messages
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
        // Notify parent about new conversation
        if (onConversationCreated && !conversationId) {
          onConversationCreated(response.conversation_id);
        }
      }

      // ChatMessageResponse extends MessageBlock, so we can return it directly
      return response;
    } catch (error: unknown) {
      console.error('Error sending query:', error);
      // Let ChatBox handle the error display
      throw error;
    }
  };

  /**
   * Send message to agent (streaming mode) - calls onEvent for each event
   */
  const handleSendMessageStreaming = async (
    query: string,
    onEvent: (event: ChatEvent) => void,
    onEnd: () => void,
    fileUuids?: string[]
  ): Promise<void> => {
    // For dynamic schema mode, validate that output_schema is provided
    if (isDynamicSchemaMode && !parsedOutputSchema) {
      toast.error(t('agents.testBench.outputSchemaRequired'));
      throw new Error('output_schema is required in dynamic schema mode');
    }

    // Track if this is a new conversation (conversationId was null before this message)
    const wasNewConversation = conversationId === null;
    let newConversationId: string | null = null;
    let newConversationTitle: string | null = null;

    try {
      await agentApi.chatWithPublishedStreaming(
        agent.uuid,
        {
          query,
          user: 'user',
          inputs: {},
          conversation_id: conversationId || undefined,
          files: fileUuids,
          output_schema: isDynamicSchemaMode ? parsedOutputSchema : undefined,
        },
        (event: ChatEvent) => {
          // Store conversation ID when received
          if (event.event === 'conversation' && event.data?.id) {
            const receivedId = event.data.id;
            newConversationId = receivedId;
            setConversationId(receivedId);
          }
          // Store conversation title when received
          if (event.event === 'title' && event.data?.title) {
            newConversationTitle = event.data.title;
            setConversationTitle(event.data.title);
          }
          // Forward event to ChatBox
          onEvent(event);
        },
        () => {
          // When stream ends, notify parent about new conversation if it's a new one
          if (onConversationCreated && wasNewConversation && newConversationId) {
            onConversationCreated(newConversationId, newConversationTitle || undefined);
          }
          onEnd();
        }
      );
    } catch (error: unknown) {
      console.error('Error in streaming:', error);
      // Let ChatBox handle the error display
      throw error;
    }
  };

  if (!isPublished) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning-soft">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            {t('agents.detail.notPublished')}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('agents.detail.notPublishedDesc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {t('agents.detail.chatWithAgent')}
          </h2>
          {conversationId && (
            <button
              onClick={handleNewChat}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
              {t('agents.testBench.newChat')}
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Schema Input Section */}
      {isDynamicSchemaMode && (
        <div className="border-b border-border bg-card px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setShowSchemaInput(!showSchemaInput)}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground"
            >
              {showSchemaInput ? (
                <ChevronDownIcon className="h-3.5 w-3.5" />
              ) : (
                <ChevronRightIcon className="h-3.5 w-3.5" />
              )}
              {t('agents.testBench.outputSchema')}
              <span className="ml-1 text-[10px] font-normal text-danger">
                ({t('common.required')})
              </span>
            </button>
          </div>
          
          {showSchemaInput && (
            <>
              {/* Info banner */}
              <div className="mb-2 p-2 rounded-md bg-warning-soft">
                <div className="flex items-start gap-2">
                  <InformationCircleIcon className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-warning">
                    {t('agents.testBench.dynamicSchemaInfo')}
                  </p>
                </div>
              </div>

              <textarea
                value={outputSchemaText}
                onChange={(e) => handleOutputSchemaChange(e.target.value)}
                placeholder={t('agents.jsonOutput.schemaPlaceholder')}
                rows={6}
                className={`w-full rounded-md border bg-background px-2 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 resize-y ${
                  outputSchemaError
                    ? 'border-danger focus:border-danger focus:ring-danger'
                    : 'border-input focus:border-primary focus:ring-primary'
                }`}
              />
              {outputSchemaError && (
                <p className="mt-1 text-xs text-danger">{outputSchemaError}</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatBox
          key={chatKey}
          onSendMessage={handleSendMessage}
          onSendMessageStreaming={handleSendMessageStreaming}
          placeholder={t('agents.testBench.queryPlaceholder')}
          showStreamingToggle={true}
          streamingMode={streamingMode}
          onStreamingModeChange={setStreamingMode}
        />
      </div>
    </div>
  );
};

export default AgentChatInterface;
