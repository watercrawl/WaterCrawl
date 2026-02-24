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
  useAgentToolConfig,
} from '../../hooks';
import { agentApi } from '../../services/api/agent';
import { toolsApi } from '../../services/api/tools';

import type { Agent, AgentVersionStatus, ContextParameters, AgentAsTool, ToolParametersConfig } from '../../types/agent';
import type { ToolListItem, APISpec, MCPServer } from '../../types/tools';

const AgentFormPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const { agentId } = useParams<{ agentId: string }>();
  const isTabletOrMobile = useIsTabletOrMobile();

  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [builtInTools, setBuiltInTools] = useState<ToolListItem[]>([]);
  const [apiSpecs, setApiSpecs] = useState<APISpec[]>([]);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [draftAgentTools, setDraftAgentTools] = useState<AgentAsTool[]>([]);
  const [editingAgentTool, setEditingAgentTool] = useState<AgentAsTool | null>(null);
  const [agentData, setAgentData] = useState<Agent | null>(null);

  // Use custom hooks for form state management
  const formState = useAgentForm(agentId);
  const {
    draft,
    name,
    systemPrompt,
    providerConfigId,
    modelKey,
    llmConfigs,
    jsonOutput,
    jsonSchema,
    contextVariables,
    draftTools,
    draftKnowledgeBases,
    saving,
    showSavedIndicator,
    setDraft,
    setName,
    setSystemPrompt,
    setProviderConfigId,
    setModelKey,
    setLlmConfigs,
    setJsonOutput,
    setJsonSchema,
    setContextVariables,
    setDraftTools,
    setDraftKnowledgeBases,
    saveAgentName,
    saveDraft,
  } = formState;

  // Fetch options (tools, etc.)
  const fetchOptions = useCallback(async () => {
    try {
      const [toolsData, apiSpecsData, mcpServersData] = await Promise.all([
        toolsApi.listTools(),
        toolsApi.listApiSpecs(),
        toolsApi.listMcpServers(),
      ]);
      setBuiltInTools(toolsData.results.filter((t: ToolListItem) => t.tool_type === 'built_in'));
      setApiSpecs(apiSpecsData.results);
      setMcpServers(mcpServersData.results);
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
      const [agentDataResponse, draftData, toolsData, kbsData, agentToolsData] = await Promise.all([
        agentApi.get(agentId),
        agentApi.getDraft(agentId),
        agentApi.listDraftTools(agentId),
        agentApi.listDraftKnowledgeBases(agentId),
        agentApi.getDraftAgentTools(agentId),
      ]);

      setAgentData(agentDataResponse);
      setDraft(draftData);
      setName(draftData.agent_name);
      setSystemPrompt(draftData.system_prompt || '');
      setProviderConfigId(draftData.provider_config_uuid || '');
      setModelKey(draftData.llm_model_key || '');
      setLlmConfigs(draftData.llm_configs || {});
      setJsonOutput(draftData.json_output || false);
      setJsonSchema(draftData.json_schema || null);
      setContextVariables(draftData.parameters || []);
      setDraftTools(toolsData);
      setDraftKnowledgeBases(kbsData);
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
    
  }, [
    agentId,
    t,
    setDraft,
    setName,
    setSystemPrompt,
    setProviderConfigId,
    setModelKey,
    setLlmConfigs,
    setJsonOutput,
    setJsonSchema,
    setContextVariables,
    setDraftTools,
    setDraftKnowledgeBases,
  ]);

  // Initialize other hooks - must be after loadDraft is defined
  const versions = useAgentVersions(agentId, loadDraft);
  const tools = useAgentTools(agentId, setDraftTools);
  const knowledgeBasesHook = useAgentKnowledgeBases(
    agentId,
    setDraftKnowledgeBases
  );
  const contextVariablesHook = useAgentContextVariables(
    contextVariables,
    setContextVariables
  );
  const toolConfig = useAgentToolConfig(
    agentId,
    agentData?.enable_as_tool || false,
    agentData?.tool_function_name || '',
    agentData?.tool_description || ''
  );
  const {
    enableAsTool,
    toolFunctionName,
    toolDescription,
    setEnableAsTool,
    setToolFunctionName,
    setToolDescription,
    saveToolConfig,
  } = toolConfig;

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
  const saveAgentNameWithState = useCallback(async () => {
    await saveAgentName({
      enable_as_tool: agentData?.enable_as_tool,
      tool_function_name: agentData?.tool_function_name,
      tool_description: agentData?.tool_description,
    });
  }, [saveAgentName, agentData]);

  const nameDeps = useMemo(() => [name], [name]);
  useAutoSave({
    enabled: !!draft,
    delay: 1000,
    onSave: saveAgentNameWithState,
    dependencies: nameDeps,
  });

  // Auto-detect {{VAR}} patterns in system prompt
  useVariableDetection({
    systemPrompt,
    existingVariables: contextVariables,
    onVariablesDetected: (newVars: ContextParameters[]) => {
      setContextVariables((prev) => [...prev, ...newVars]);
    },
  });

  // Auto-save draft on form changes
  // Serialize llmConfigs for reliable change detection
  const llmConfigsSerialized = useMemo(
    () => JSON.stringify(llmConfigs),
    [llmConfigs]
  );
  const jsonSchemaSerialized = useMemo(
    () => (jsonSchema ? JSON.stringify(jsonSchema) : 'null'),
    [jsonSchema]
  );

  useAutoSave({
    enabled: !!draft,
    delay: 1000,
    onSave: saveDraft,
    dependencies: [
      modelKey,
      llmConfigsSerialized,
      providerConfigId,
      systemPrompt,
      jsonOutput,
      jsonSchemaSerialized,
      JSON.stringify(contextVariables),
    ],
  });

  // Auto-save for tool toggle activation/deactivation only
  useAutoSave({
    enabled: !!agentId && agentData !== null,
    delay: 500,
    onSave: async () => {
      // Only save the enable_as_tool flag, not the fields (those are saved via modal)
      if (!agentId) return;
      const previousValue = agentData?.enable_as_tool;
      try {
        const updated = await agentApi.update(agentId, {
          enable_as_tool: enableAsTool,
        });
        // Update agentData with the saved value
        setAgentData(updated);
      } catch (error: any) {
        console.error('Error auto-saving tool toggle:', error);
        
        // Show specific error message from backend
        const errorMessage = 
          error?.response?.data?.errors?.enable_as_tool?.[0] ||
          error?.response?.data?.message ||
          t('errors.generic');
        toast.error(errorMessage);
        
        // Revert the switch to previous value on failure
        if (previousValue !== undefined) {
          setEnableAsTool(previousValue);
        }
      }
    },
    dependencies: [enableAsTool],
  });

  useEffect(() => {
    if (draft && name) {
      setItems([
        { label: t('dashboard.navigation.dashboard'), href: '/dashboard' },
        { label: t('dashboard.navigation.agents'), href: '/dashboard/agents' },
        { label: name, current: true },
      ]);
    }
  }, [draft, name, setItems, t]);

  const handlePublish = useCallback(async () => {
    if (!agentId || !draft) return;

    if (!name.trim()) {
      toast.error(t('agents.form.nameRequired'));
      return;
    }

    if (!systemPrompt.trim()) {
      toast.error(t('agents.form.systemPromptRequired'));
      return;
    }

    if (!providerConfigId || !modelKey) {
      toast.error(t('agents.form.llmRequired'));
      return;
    }

    // Validate tool configuration if enabled
    if (enableAsTool) {
      if (!toolFunctionName.trim()) {
        toast.error(t('agents.form.toolFunctionNameRequired'));
        return;
      }
      if (!toolDescription.trim()) {
        toast.error(t('agents.form.toolDescriptionRequired'));
        return;
      }
    }

    // Save both agent name, draft, and tool config first
    await Promise.all([
      saveAgentName({
        enable_as_tool: enableAsTool,
        tool_function_name: toolFunctionName,
        tool_description: toolDescription,
      }),
      saveDraft(),
      saveToolConfig(),
    ]);

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
  }, [
    agentId,
    draft,
    name,
    systemPrompt,
    providerConfigId,
    modelKey,
    saveAgentName,
    saveDraft,
    enableAsTool,
    toolFunctionName,
    toolDescription,
    saveToolConfig,
    t,
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
    const canTest = providerConfigId && modelKey && agentId;
    if (!canTest || !draft || !agentData) return null;

    return {
      uuid: agentId,
      name: name || t('agents.form.draftAgent'),
      status: 'draft' as AgentVersionStatus,
      enable_as_tool: agentData.enable_as_tool,
      tool_function_name: agentData.tool_function_name,
      tool_description: agentData.tool_description,
      created_at: draft.created_at,
      updated_at: draft.updated_at,
    };
  }, [agentId, providerConfigId, modelKey, draft, name, agentData, t]);

  // Early return must be after all hooks
  if (loading) {
    return <Loading />;
  }

  return (
    <div className="h-full bg-background">
      {/* Top Header */}
      <AgentFormHeader
        agentId={agentId!}
        name={name}
        showSavedIndicator={showSavedIndicator}
        isTabletOrMobile={isTabletOrMobile}
        publishing={publishing}
        saving={saving}
        isPublished={agentData?.status === 'published'}
        enableAsTool={enableAsTool}
        toolFunctionName={toolFunctionName}
        toolDescription={toolDescription}
        onEnableAsToolChange={setEnableAsTool}
        onToolFunctionNameChange={setToolFunctionName}
        onToolDescriptionChange={setToolDescription}
        onSaveToolConfig={saveToolConfig}
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
              name={name}
              systemPrompt={systemPrompt}
              onNameChange={setName}
              onSystemPromptChange={setSystemPrompt}
            />

            {/* Context Variables */}
            <AgentFormContextVariablesSection
              contextVariables={contextVariables}
              onAdd={() => contextVariablesHook.openVariableModal()}
              onEdit={(index) => contextVariablesHook.openVariableModal(index)}
              onRemove={contextVariablesHook.removeContextVariable}
            />

            {/* LLM Configuration */}
            <AgentFormLLMConfigSection
              providerConfigId={providerConfigId}
              modelKey={modelKey}
              llmConfigs={llmConfigs}
              onConfigChange={(values) => {
                setProviderConfigId(values.provider_config_id || '');
                setModelKey(values.model_key || '');
                // Always create a new object reference to ensure deep comparison detects the change
                setLlmConfigs({ ...(values.model_config || {}) });
              }}
            />

            {/* JSON Output Format */}
            <AgentFormJsonOutputSection
              jsonOutput={jsonOutput}
              jsonSchema={jsonSchema}
              onJsonOutputChange={setJsonOutput}
              onJsonSchemaChange={setJsonSchema}
            />

            {/* Tools Section */}
            <AgentFormToolsSection
              agentId={agentId!}
              draftTools={draftTools}
              builtInTools={builtInTools}
              apiSpecs={apiSpecs}
              mcpServers={mcpServers}
              onAddTool={tools.addTool}
              onRemoveTool={tools.removeTool}
              onSaveToolConfig={tools.saveToolConfig}
            />

            {/* Knowledge Bases */}
            <AgentFormKnowledgeBasesSection
              draftKnowledgeBases={draftKnowledgeBases}
              onAdd={knowledgeBasesHook.addKnowledgeBase}
              onRemove={knowledgeBasesHook.removeKnowledgeBase}
              onConfigure={knowledgeBasesHook.setEditingKnowledgeBase}
            />

            {/* Agent Tools */}
            <AgentFormAgentToolsSection
              draftAgentTools={draftAgentTools}
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
                contextVariableTemplates={contextVariables}
                jsonOutput={jsonOutput}
                jsonSchema={jsonSchema}
                mode="inline"
              />
            </div>
          </div>
        )}

        {/* Mobile Test Bench - Floating Button */}
        {isTabletOrMobile && (
          <AgentTestBenchPanel
            agent={tempAgent}
            contextVariableTemplates={contextVariables}
            jsonOutput={jsonOutput}
            jsonSchema={jsonSchema}
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
