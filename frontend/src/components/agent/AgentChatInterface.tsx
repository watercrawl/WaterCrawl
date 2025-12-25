import { useState } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { ArrowPathIcon } from '@heroicons/react/24/outline';

import ChatBox from '../chat/ChatBox';

import { agentApi } from '../../services/api/agent';

import type { Agent } from '../../types/agent';
import type { MessageBlock, ChatEvent } from '../../types/conversation';

interface AgentChatInterfaceProps {
  agent: Agent;
  isPublished: boolean;
  onConversationCreated?: (conversationId: string, title?: string) => void;
}

const AgentChatInterface: React.FC<AgentChatInterfaceProps> = ({ agent, isPublished, onConversationCreated }) => {
  const { t } = useTranslation();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const [_conversationTitle, setConversationTitle] = useState<string | null>(null);

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
    try {
      const response = await agentApi.chatWithPublishedBlocking(
        agent.uuid,
        {
          query,
          user: 'user',
          inputs: {},
          conversation_id: conversationId || undefined,
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
    } catch (error: any) {
      console.error('Error sending query:', error);
      toast.error(error.response?.data?.message || t('errors.generic'));
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
    } catch (error: any) {
      console.error('Error in streaming:', error);
      toast.error(error.response?.data?.message || t('errors.generic'));
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

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatBox
          key={chatKey}
          onSendMessage={handleSendMessage}
          onSendMessageStreaming={handleSendMessageStreaming}
          placeholder={t('agents.testBench.queryPlaceholder')}
          showStreamingToggle={true}
          defaultStreamingMode={true}
        />
      </div>
    </div>
  );
};

export default AgentChatInterface;
