import { useState, useEffect, useCallback, useMemo } from 'react';

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

import type { Agent, ContextParameters } from '../../types/agent';
import type { ChatEvent } from '../../types/conversation';

interface AgentTestBenchSimpleProps {
  agent: Agent;
  contextVariableTemplates?: ContextParameters[];
  /** Whether structured JSON output is enabled for this agent */
  jsonOutput?: boolean;
  /** Predefined JSON schema for output (null means dynamic mode when jsonOutput is true) */
  jsonSchema?: Record<string, unknown> | null;
}

const AgentTestBenchSimple: React.FC<AgentTestBenchSimpleProps> = ({
  agent,
  contextVariableTemplates = [],
  jsonOutput = false,
  jsonSchema = null,
}) => {
  const { t } = useTranslation();
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [contextVariables, setContextVariables] = useState<ContextParameters[]>([]);
  const [chatKey, setChatKey] = useState(0); // Key to force re-render ChatBox
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

  // Auto-expand schema input in dynamic mode
  useEffect(() => {
    if (isDynamicSchemaMode) {
      setShowSchemaInput(true);
    }
  }, [isDynamicSchemaMode]);

  const handleNewChat = () => {
    setConversationId(undefined);
    setChatKey(prev => prev + 1); // Force re-render to clear messages
    toast.success(t('agents.testBench.newChatStarted'));
  };

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
   * Send message to agent (streaming only) - calls onEvent for each event
   */
  const handleSendMessage = async (
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

    // For dynamic schema mode, validate that output_schema is provided
    if (isDynamicSchemaMode && !parsedOutputSchema) {
      toast.error(t('agents.testBench.outputSchemaRequired'));
      throw new Error('output_schema is required in dynamic schema mode');
    }

    try {
      await agentApi.chatWithDraft(
        agent.uuid,
        {
          query,
          user: 'test-user',
          inputs: buildInputs(),
          conversation_id: conversationId,
          files: fileUuids,
          output_schema: isDynamicSchemaMode ? parsedOutputSchema : undefined,
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
    } catch (error: unknown) {
      console.error('Error in streaming:', error);
      // Let ChatBox handle the error display
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
                <span className="text-[10px] text-muted-foreground w-12 flex-shrink-0 text-end">
                  ({variable.parameter_type})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Schema Input Section */}
      {isDynamicSchemaMode && (
        <div className="border-b border-border bg-card p-3">
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
          placeholder={t('agents.testBench.queryPlaceholder')}
        />
      </div>
    </div>
  );
};

export default AgentTestBenchSimple;
