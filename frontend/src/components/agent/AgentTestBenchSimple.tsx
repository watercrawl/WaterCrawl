import { useState, useEffect, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { ArrowPathIcon } from '@heroicons/react/24/outline';

import ChatBox from '../chat/ChatBox';

import { agentApi } from '../../services/api/agent';

import type { Agent, ContextParameters } from '../../types/agent';
import type { MessageBlock, ChatEvent } from '../../types/conversation';


interface AgentTestBenchSimpleProps {
  agent: Agent;
  contextVariableTemplates?: ContextParameters[];
}

const AgentTestBenchSimple: React.FC<AgentTestBenchSimpleProps> = ({ agent, contextVariableTemplates = [] }) => {
  const { t } = useTranslation();
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [contextVariables, setContextVariables] = useState<ContextParameters[]>([]);
  const [chatKey, setChatKey] = useState(0); // Key to force re-render ChatBox

  // Initialize context variables from templates
  useEffect(() => {
    if (contextVariableTemplates.length > 0) {
      const initialized = contextVariableTemplates.map(template => ({
        name: template.name,
        value: template.value || '',
        parameter_type: template.parameter_type,
      }));
      setContextVariables(initialized);
    }
  }, [contextVariableTemplates]);

  const handleNewChat = () => {
    setConversationId(undefined);
    setChatKey(prev => prev + 1); // Force re-render to clear messages
    toast.success(t('agents.testBench.newChatStarted'));
  };

  /**
   * Build inputs from context variables
   */
  const buildInputs = useCallback(() => {
    const inputs: Record<string, any> = {};
    contextVariables.forEach(v => {
      if (v.parameter_type === 'number') {
        inputs[v.name] = parseFloat(v.value) || 0;
      } else if (v.parameter_type === 'boolean') {
        inputs[v.name] = v.value === 'true';
      } else {
        inputs[v.name] = v.value;
      }
    });
    return inputs;
  }, [contextVariables]);

  /**
   * Send message to agent (blocking mode) - returns the response MessageBlock
   */
  const handleSendMessage = async (query: string): Promise<MessageBlock> => {
    // Draft mode simulation for temp agent
    if (agent.uuid === 'temp') {
      toast(t('agents.testBench.draftModeResponse'));
      throw new Error('Draft mode - cannot send messages');
    }

    try {
      // Call blocking API
      const response = await agentApi.chatWithDraftBlocking(
        agent.uuid,
        {
          query,
          user: 'test-user',
          inputs: buildInputs(),
          conversation_id: conversationId,
        }
      );

      // Store conversation ID for follow-up messages
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      // Return the message block
      return response;
    } catch (error: any) {
      console.error('Error sending message:', error);
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
    // Draft mode simulation for temp agent
    if (agent.uuid === 'temp') {
      toast(t('agents.testBench.draftModeResponse'));
      throw new Error('Draft mode - cannot send messages');
    }

    try {
      await agentApi.chatWithDraftStreaming(
        agent.uuid,
        {
          query,
          user: 'test-user',
          inputs: buildInputs(),
          conversation_id: conversationId,
          files: fileUuids,
        },
        (event: ChatEvent) => {
          // Store conversation ID when received
          if (event.event === 'conversation' && event.data.id) {
            setConversationId(event.data.id);
          }
          // Forward event to ChatBox
          onEvent(event);
        },
        onEnd
      );
    } catch (error: any) {
      console.error('Error in streaming:', error);
      toast.error(error.response?.data?.message || t('errors.generic'));
      throw error;
    }
  };


  return (
    <div className="flex h-full flex-col">
      {/* Variables Section */}
      {contextVariables.length > 0 && (
        <div className="border-b border-border bg-card p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
              {t('agents.testBench.contextVariables')}
            </h3>
          </div>
          <div className="space-y-2">
            {contextVariables.map((variable, index) => (
              <div
                key={variable.name}
                className="flex items-center gap-x-2"
              >
                <label className="text-xs font-mono text-muted-foreground w-24 flex-shrink-0">
                  {variable.name}
                </label>
                {variable.parameter_type === 'boolean' ? (
                  <select
                    value={variable.value}
                    onChange={e => {
                      const updated = [...contextVariables];
                      updated[index] = { ...updated[index], value: e.target.value };
                      setContextVariables(updated);
                    }}
                    className="block flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input
                    type={variable.parameter_type === 'number' ? 'number' : 'text'}
                    value={variable.value}
                    onChange={e => {
                      const updated = [...contextVariables];
                      updated[index] = { ...updated[index], value: e.target.value };
                      setContextVariables(updated);
                    }}
                    placeholder={variable.parameter_type === 'number' ? '0' : t('agents.testBench.enterValue')}
                    className="block flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}
                <span className="text-[10px] text-muted-foreground w-12 flex-shrink-0 text-right">
                  ({variable.parameter_type})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header with New Chat button */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            {t('agents.testBench.debugPreview')}
          </h3>
          <button
            onClick={handleNewChat}
            className="inline-flex items-center gap-x-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
            {t('agents.testBench.newChat')}
          </button>
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

export default AgentTestBenchSimple;
