import { useState, useCallback } from 'react';

import { agentApi } from '../services/api/agent';

import type { AgentVersion, AgentTool, AgentKnowledgeBase, ContextParameters } from '../types/agent';

interface UseAgentFormState {
  name: string;
  systemPrompt: string;
  providerConfigId: string;
  modelKey: string;
  llmConfigs: Record<string, unknown>;
  jsonOutput: boolean;
  jsonSchema: Record<string, unknown> | null;
  contextVariables: ContextParameters[];
  draft: AgentVersion | null;
  draftTools: AgentTool[];
  draftKnowledgeBases: AgentKnowledgeBase[];
}

interface UseAgentFormReturn extends UseAgentFormState {
  setName: React.Dispatch<React.SetStateAction<string>>;
  setSystemPrompt: React.Dispatch<React.SetStateAction<string>>;
  setProviderConfigId: React.Dispatch<React.SetStateAction<string>>;
  setModelKey: React.Dispatch<React.SetStateAction<string>>;
  setLlmConfigs: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  setJsonOutput: React.Dispatch<React.SetStateAction<boolean>>;
  setJsonSchema: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>;
  setContextVariables: React.Dispatch<React.SetStateAction<ContextParameters[]>>;
  setDraft: React.Dispatch<React.SetStateAction<AgentVersion | null>>;
  setDraftTools: React.Dispatch<React.SetStateAction<AgentTool[]>>;
  setDraftKnowledgeBases: React.Dispatch<React.SetStateAction<AgentKnowledgeBase[]>>;
  saveAgentName: () => Promise<void>;
  saveDraft: () => Promise<void>;
  showSaveSuccess: () => void;
  showSavedIndicator: boolean;
  saving: boolean;
}

export const useAgentForm = (agentId: string | undefined): UseAgentFormReturn => {
  
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [providerConfigId, setProviderConfigId] = useState('');
  const [modelKey, setModelKey] = useState('');
  const [llmConfigs, setLlmConfigs] = useState<Record<string, unknown>>({});
  const [jsonOutput, setJsonOutput] = useState(false);
  const [jsonSchema, setJsonSchema] = useState<Record<string, unknown> | null>(null);
  const [contextVariables, setContextVariables] = useState<ContextParameters[]>([]);
  const [draft, setDraft] = useState<AgentVersion | null>(null);
  const [draftTools, setDraftTools] = useState<AgentTool[]>([]);
  const [draftKnowledgeBases, setDraftKnowledgeBases] = useState<AgentKnowledgeBase[]>([]);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [saving, setSaving] = useState(false);

  const showSaveSuccess = useCallback(() => {
    setShowSavedIndicator(true);
    setTimeout(() => setShowSavedIndicator(false), 2000);
  }, []);

  const saveAgentName = useCallback(async () => {
    if (!agentId || !name.trim()) return;

    try {
      await agentApi.update(agentId, { name: name.trim() });
      showSaveSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error saving agent name:', errorMessage);
    }
  }, [agentId, name, showSaveSuccess]);

  const saveDraft = useCallback(async () => {
    if (!agentId || !draft) return;

    setSaving(true);
    try {
      const updated = await agentApi.updateDraft(agentId, {
        system_prompt: systemPrompt,
        provider_config_uuid: providerConfigId || undefined,
        llm_model_key: modelKey || undefined,
        llm_configs: llmConfigs,
        json_output: jsonOutput,
        json_schema: jsonSchema || null,
        parameters: contextVariables,
      });
      setDraft(updated);
      showSaveSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error saving draft:', errorMessage);
    } finally {
      setSaving(false);
    }
  }, [
    agentId,
    draft,
    systemPrompt,
    providerConfigId,
    modelKey,
    llmConfigs,
    jsonOutput,
    jsonSchema,
    contextVariables,
    showSaveSuccess,
  ]);

  return {
    name,
    systemPrompt,
    providerConfigId,
    modelKey,
    llmConfigs,
    jsonOutput,
    jsonSchema,
    contextVariables,
    draft,
    draftTools,
    draftKnowledgeBases,
    setName,
    setSystemPrompt,
    setProviderConfigId,
    setModelKey,
    setLlmConfigs,
    setJsonOutput,
    setJsonSchema,
    setContextVariables,
    setDraft,
    setDraftTools,
    setDraftKnowledgeBases,
    saveAgentName,
    saveDraft,
    showSaveSuccess,
    showSavedIndicator,
    saving,
  };
};
