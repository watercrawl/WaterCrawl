import { useState, useEffect, useCallback, useMemo } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import AgentTestBenchPanel from '../../components/agent/AgentTestBenchPanel';
import AgentToolConfigModal from '../../components/agent/AgentToolConfigModal';
import AgentFormAgentToolsSection from '../../components/agent/form/AgentFormAgentToolsSection';
import AgentFormContextVariablesSection from '../../components/agent/form/AgentFormContextVariablesSection';
import AgentFormHeader from '../../components/agent/form/AgentFormHeader';
import AgentFormInstructionsSection from '../../components/agent/form/AgentFormInstructionsSection';
import AgentFormJsonOutputSection from '../../components/agent/form/AgentFormJsonOutputSection';
import AgentFormKnowledgeBasesSection from '../../components/agent/form/AgentFormKnowledgeBasesSection';
import AgentFormLLMConfigSection from '../../components/agent/form/AgentFormLLMConfigSection';
import AgentFormToolsSection from '../../components/agent/form/AgentFormToolsSection';
import KnowledgeBaseConfigModal from '../../components/agent/KnowledgeBaseConfigModal';
import VariableModal from '../../components/agent/modals/VariableModal';
import VersionHistoryModal from '../../components/agent/modals/VersionHistoryModal';
import Loading from '../../components/shared/Loading';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import {
  useAutoSave,
  useVariableDetection,
  useIsTabletOrMobile,
  useAgentForm,
  useAgentTools,
  useAgentKnowledgeBases,
  useAgentContextVariables,
  useAgentVersions,
} from '../../hooks';
import { agentApi } from '../../services/api/agent';
import { knowledgeBaseApi } from '../../services/api/knowledgeBase';
import { toolsApi } from '../../services/api/tools';

import type { Agent, AgentVersionStatus, ContextParameters, AgentAsTool, ToolParametersConfig } from '../../types/agent';
import type { KnowledgeBaseDetail } from '../../types/knowledge';
import type { ToolListItem, APISpec, MCPServer } from '../../types/tools';

const AgentFormPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const { agentId } = useParams<{ agentId: string }>();
  const isTabletOrMobile = useIsTabletOrMobile();

  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseDetail[]>([]);
  const [builtInTools, setBuiltInTools] = useState<ToolListItem[]>([]);
  const [apiSpecs, setApiSpecs] = useState<APISpec[]>([]);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [draftAgentTools, setDraftAgentTools] = useState<AgentAsTool[]>([]);
  const [editingAgentTool, setEditingAgentTool] = useState<AgentAsTool | null>(null);

  // Use custom hooks for form state management
  const formState = useAgentForm(agentId);

  // Fetch options (knowledge bases, tools, agents, etc.)
  const fetchOptions = useCallback(async () => {
    try {
      const [kbData, toolsData, apiSpecsData, mcpServersData, agentsData] = await Promise.all([
        knowledgeBaseApi.list(1, 100),
        toolsApi.listTools(),
        toolsApi.listApiSpecs(),
        toolsApi.listMcpServers(),
        agentApi.list(),
      ]);
      setKnowledgeBases(kbData.results);
      setBuiltInTools(toolsData.results.filter((t: ToolListItem) => t.tool_type === 'built_in'));
      setApiSpecs(apiSpecsData.results);
      setMcpServers(mcpServersData.results);
      setAvailableAgents(agentsData.results);
    } catch (error) {
      console.error('Error fetching options:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error.response as { data?: { message?: string } })?.data?.message
          : undefined;
      toast.error(errorMessage || t('errors.generic'));
    }
  }, [t]);

  // Load draft
  const loadDraft = useCallback(async () => {
    if (!agentId) return;

    setLoading(true);
    try {
      const [draftData, toolsData, kbsData, agentToolsData] = await Promise.all([
        agentApi.getDraft(agentId),
        agentApi.listDraftTools(agentId),
        agentApi.listDraftKnowledgeBases(agentId),
        agentApi.getDraftAgentTools(agentId),
      ]);

      formState.setDraft(draftData);
      formState.setName(draftData.agent_name);
      formState.setSystemPrompt(draftData.system_prompt || '');
      formState.setProviderConfigId(draftData.provider_config_uuid || '');
      formState.setModelKey(draftData.llm_model_key || '');
      formState.setLlmConfigs(draftData.llm_configs || {});
      formState.setJsonOutput(draftData.json_output || false);
      formState.setJsonSchema(draftData.json_schema || null);
      formState.setContextVariables(draftData.parameters || []);
      formState.setDraftTools(toolsData);
      formState.setDraftKnowledgeBases(kbsData);
      setDraftAgentTools(agentToolsData);
    } catch (error) {
      console.error('Error loading draft:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error.response as { data?: { detail?: string } })?.data?.detail
          : undefined;
      toast.error(errorMessage || t('errors.generic'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, t]);

  // Initialize other hooks - must be after loadDraft is defined
  const versions = useAgentVersions(agentId, loadDraft);
  const tools = useAgentTools(agentId, formState.setDraftTools);
  const knowledgeBasesHook = useAgentKnowledgeBases(
    agentId,
    formState.setDraftKnowledgeBases
  );
  const contextVariablesHook = useAgentContextVariables(
    formState.contextVariables,
    formState.setContextVariables
  );

  useEffect(() => {
    // Redirect to agents list if no agentId (this page is only for editing)
    if (!agentId) {
      navigate('/dashboard/agents');
      return;
    }

    fetchOptions();
    loadDraft();
  }, [agentId, navigate, fetchOptions, loadDraft]);

  // Auto-save agent name on changes
  useAutoSave({
    enabled: !!formState.draft,
    delay: 1000,
    onSave: formState.saveAgentName,
    dependencies: [formState.name],
  });

  // Auto-detect {{VAR}} patterns in system prompt
  useVariableDetection({
    systemPrompt: formState.systemPrompt,
    existingVariables: formState.contextVariables,
    onVariablesDetected: (newVars: ContextParameters[]) => {
      formState.setContextVariables((prev) => [...prev, ...newVars]);
    },
  });

  // Auto-save draft on form changes
  // Serialize llmConfigs for reliable change detection
  const llmConfigsSerialized = useMemo(
    () => JSON.stringify(formState.llmConfigs),
    [formState.llmConfigs]
  );
  const jsonSchemaSerialized = useMemo(
    () => (formState.jsonSchema ? JSON.stringify(formState.jsonSchema) : 'null'),
    [formState.jsonSchema]
  );

  useAutoSave({
    enabled: !!formState.draft,
    delay: 1000,
    onSave: formState.saveDraft,
    dependencies: [
      formState.modelKey,
      llmConfigsSerialized, // Use serialized version for reliable comparison
      formState.providerConfigId,
      formState.systemPrompt,
      formState.jsonOutput,
      jsonSchemaSerialized, // Use serialized version for reliable comparison
      // Serialize contextVariables array for reliable comparison
      JSON.stringify(formState.contextVariables),
    ],
  });

  useEffect(() => {
    if (formState.draft && formState.name) {
      setItems([
        { label: t('dashboard.navigation.dashboard'), href: '/dashboard' },
        { label: t('dashboard.navigation.agents'), href: '/dashboard/agents' },
        { label: formState.name, current: true },
      ]);
    }
  }, [formState.draft, formState.name, setItems, t]);

  const handlePublish = useCallback(async () => {
    if (!agentId || !formState.draft) return;

    if (!formState.name.trim()) {
      toast.error(t('agents.form.nameRequired'));
      return;
    }

    if (!formState.systemPrompt.trim()) {
      toast.error(t('agents.form.systemPromptRequired'));
      return;
    }

    if (!formState.providerConfigId || !formState.modelKey) {
      toast.error(t('agents.form.llmRequired'));
      return;
    }

    // Save both agent name and draft first
    await Promise.all([formState.saveAgentName(), formState.saveDraft()]);

    setPublishing(true);
    try {
      await agentApi.publishDraft(agentId);
      toast.success(t('agents.form.publishSuccess'));
      // Reload draft to reflect published status
      loadDraft();
    } catch (error) {
      console.error('Error publishing agent:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error.response as { data?: { detail?: string } })?.data?.detail
          : undefined;
      toast.error(errorMessage || t('errors.generic'));
    } finally {
      setPublishing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    agentId,
    t,
    formState.draft,
    formState.name,
    formState.systemPrompt,
    formState.providerConfigId,
    formState.modelKey,
    formState.saveAgentName,
    formState.saveDraft,
    loadDraft,
  ]);

  // Agent Tools handlers
  const handleAddAgentTool = useCallback(
    async (toolAgentUuid: string) => {
      if (!agentId) return;

      try {
        const newAgentTool = await agentApi.addDraftAgentTool(agentId, {
          tool_agent_uuid: toolAgentUuid,
        });
        setDraftAgentTools((prev) => [...prev, newAgentTool]);
        toast.success(t('agents.form.agentToolAdded'));
      } catch (error) {
        console.error('Error adding agent tool:', error);
        const errorMessage =
          error && typeof error === 'object' && 'response' in error
            ? (error.response as { data?: { detail?: string } })?.data?.detail
            : undefined;
        toast.error(errorMessage || t('errors.generic'));
      }
    },
    [agentId, t]
  );

  const handleRemoveAgentTool = useCallback(
    async (agentToolUuid: string) => {
      if (!agentId) return;

      try {
        await agentApi.removeDraftAgentTool(agentId, agentToolUuid);
        setDraftAgentTools((prev) => prev.filter((at) => at.uuid !== agentToolUuid));
        toast.success(t('agents.form.agentToolRemoved'));
      } catch (error) {
        console.error('Error removing agent tool:', error);
        const errorMessage =
          error && typeof error === 'object' && 'response' in error
            ? (error.response as { data?: { detail?: string } })?.data?.detail
            : undefined;
        toast.error(errorMessage || t('errors.generic'));
      }
    },
    [agentId, t]
  );

  // Save agent tool config handler
  const handleSaveAgentToolConfig = useCallback(
    async (config: ToolParametersConfig) => {
      if (!agentId || !editingAgentTool) return;

      try {
        const updated = await agentApi.updateDraftAgentTool(agentId, editingAgentTool.uuid, { config });
        setDraftAgentTools((prev) =>
          prev.map((at) => (at.uuid === editingAgentTool.uuid ? updated : at))
        );
        toast.success(t('agents.form.agentToolConfigSaved'));
      } catch (error) {
        console.error('Error saving agent tool config:', error);
        const errorMessage =
          error && typeof error === 'object' && 'response' in error
            ? (error.response as { data?: { detail?: string } })?.data?.detail
            : undefined;
        toast.error(errorMessage || t('errors.generic'));
        throw error;
      }
    },
    [agentId, editingAgentTool, t]
  );

  // Create temp agent for test bench
  const tempAgent = useMemo<Agent | null>(() => {
    const canTest = formState.providerConfigId && formState.modelKey && agentId;
    if (!canTest || !formState.draft) return null;

    return {
      uuid: agentId,
      name: formState.name || t('agents.form.draftAgent'),
      status: 'draft' as AgentVersionStatus,
      created_at: formState.draft.created_at,
      updated_at: formState.draft.updated_at,
    };
  }, [agentId, formState.providerConfigId, formState.modelKey, formState.draft, formState.name, t]);

  // Early return must be after all hooks
  if (loading) {
    return <Loading />;
  }

  return (
    <div className="h-full bg-background">
      {/* Top Header */}
      <AgentFormHeader
        agentId={agentId!}
        name={formState.name}
        showSavedIndicator={formState.showSavedIndicator}
        isTabletOrMobile={isTabletOrMobile}
        publishing={publishing}
        saving={formState.saving}
        onVersionHistory={versions.loadVersionHistory}
        onPublish={handlePublish}
      />

      {/* Split Panel Layout */}
      <div className="flex" style={{ height: 'calc(100vh - 64px - 50px - 64px)' }}>
        {/* Left Panel - Configuration */}
        <div
          className={
            isTabletOrMobile
              ? 'w-full overflow-y-auto bg-background p-6'
              : 'w-1/2 overflow-y-auto border-r border-border bg-background p-4'
          }
        >
          <div className="space-y-4">
            {/* Instructions Section */}
            <AgentFormInstructionsSection
              name={formState.name}
              systemPrompt={formState.systemPrompt}
              onNameChange={formState.setName}
              onSystemPromptChange={formState.setSystemPrompt}
            />

            {/* Context Variables */}
            <AgentFormContextVariablesSection
              contextVariables={formState.contextVariables}
              onAdd={() => contextVariablesHook.openVariableModal()}
              onEdit={(index) => contextVariablesHook.openVariableModal(index)}
              onRemove={contextVariablesHook.removeContextVariable}
            />

            {/* LLM Configuration */}
            <AgentFormLLMConfigSection
              providerConfigId={formState.providerConfigId}
              modelKey={formState.modelKey}
              llmConfigs={formState.llmConfigs}
              onConfigChange={(values) => {
                formState.setProviderConfigId(values.provider_config_id || '');
                formState.setModelKey(values.model_key || '');
                // Always create a new object reference to ensure deep comparison detects the change
                formState.setLlmConfigs({ ...(values.model_config || {}) });
              }}
            />

            {/* JSON Output Format */}
            <AgentFormJsonOutputSection
              jsonOutput={formState.jsonOutput}
              jsonSchema={formState.jsonSchema}
              onJsonOutputChange={formState.setJsonOutput}
              onJsonSchemaChange={formState.setJsonSchema}
            />

            {/* Tools Section */}
            <AgentFormToolsSection
              agentId={agentId!}
              draftTools={formState.draftTools}
              builtInTools={builtInTools}
              apiSpecs={apiSpecs}
              mcpServers={mcpServers}
              onAddTool={tools.addTool}
              onRemoveTool={tools.removeTool}
              onSaveToolConfig={tools.saveToolConfig}
            />

            {/* Knowledge Bases */}
            <AgentFormKnowledgeBasesSection
              draftKnowledgeBases={formState.draftKnowledgeBases}
              knowledgeBases={knowledgeBases}
              onAdd={knowledgeBasesHook.addKnowledgeBase}
              onRemove={knowledgeBasesHook.removeKnowledgeBase}
              onConfigure={knowledgeBasesHook.setEditingKnowledgeBase}
            />

            {/* Agent Tools */}
            <AgentFormAgentToolsSection
              draftAgentTools={draftAgentTools}
              availableAgents={availableAgents}
              currentAgentUuid={agentId!}
              onAdd={handleAddAgentTool}
              onRemove={handleRemoveAgentTool}
              onConfigure={setEditingAgentTool}
            />
          </div>
        </div>

        {/* Right Panel - Test Bench (Desktop Only) */}
        {!isTabletOrMobile && (
          <div className="w-1/2 flex flex-col bg-muted/30">
            <div className="flex-1 overflow-hidden">
              <AgentTestBenchPanel
                agent={tempAgent}
                contextVariableTemplates={formState.contextVariables}
                jsonOutput={formState.jsonOutput}
                jsonSchema={formState.jsonSchema}
                mode="inline"
              />
            </div>
          </div>
        )}

        {/* Mobile Test Bench - Floating Button */}
        {isTabletOrMobile && (
          <AgentTestBenchPanel
            agent={tempAgent}
            contextVariableTemplates={formState.contextVariables}
            jsonOutput={formState.jsonOutput}
            jsonSchema={formState.jsonSchema}
            mode="sidebar"
            defaultOpen={false}
          />
        )}
      </div>

      {/* Variable Modal */}
      <VariableModal
        isOpen={contextVariablesHook.showVariableModal}
        onClose={() => contextVariablesHook.setShowVariableModal(false)}
        variableForm={contextVariablesHook.variableForm}
        onVariableFormChange={contextVariablesHook.setVariableForm}
        onSave={contextVariablesHook.saveVariable}
        isEditing={contextVariablesHook.editingVariableIndex !== null}
      />

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={versions.showVersionHistory}
        onClose={() => versions.setShowVersionHistory(false)}
        versions={versions.versions}
        onRevert={versions.revertToVersion}
      />

      {/* Knowledge Base Config Modal */}
      {knowledgeBasesHook.editingKnowledgeBase && (
        <KnowledgeBaseConfigModal
          isOpen={!!knowledgeBasesHook.editingKnowledgeBase}
          onClose={() => knowledgeBasesHook.setEditingKnowledgeBase(null)}
          knowledgeBase={knowledgeBasesHook.editingKnowledgeBase}
          onSave={knowledgeBasesHook.saveKnowledgeBaseConfig}
        />
      )}

      {/* Agent Tool Config Modal */}
      {editingAgentTool && (
        <AgentToolConfigModal
          isOpen={!!editingAgentTool}
          onClose={() => setEditingAgentTool(null)}
          agentTool={editingAgentTool}
          onSave={handleSaveAgentToolConfig}
        />
      )}
    </div>
  );
};

export default AgentFormPage;
