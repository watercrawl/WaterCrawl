import { useState, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { agentApi } from '../services/api/agent';

import type { AgentTool, ToolParametersConfig } from '../types/agent';

interface UseAgentToolsReturn {
  editingTool: AgentTool | null;
  setEditingTool: (tool: AgentTool | null) => void;
  addTool: (toolUuid: string) => Promise<void>;
  removeTool: (toolUuid: string) => Promise<void>;
  saveToolConfig: (toolUuid: string, config: ToolParametersConfig) => Promise<void>;
}

export const useAgentTools = (
  agentId: string | undefined,
  setDraftTools: React.Dispatch<React.SetStateAction<AgentTool[]>>
): UseAgentToolsReturn => {
  const { t } = useTranslation();
  const [editingTool, setEditingTool] = useState<AgentTool | null>(null);

  const addTool = useCallback(
    async (toolUuid: string) => {
      if (!agentId) return;

      try {
        const newTool = await agentApi.addDraftTool(agentId, {
          tool_uuid: toolUuid,
          config: {},
        });
        setDraftTools((prev) => [...prev, newTool]);
        toast.success(t('agents.form.toolAdded'));
      } catch (error) {
        console.error('Error adding tool:', error);
        const errorMessage =
          error && typeof error === 'object' && 'response' in error
            ? (error.response as { data?: { detail?: string } })?.data?.detail
            : undefined;
        toast.error(errorMessage || t('errors.generic'));
      }
    },
    [agentId, setDraftTools, t]
  );

  const removeTool = useCallback(
    async (toolUuid: string) => {
      if (!agentId) return;

      try {
        await agentApi.removeDraftTool(agentId, toolUuid);
        setDraftTools((prev) => prev.filter((t) => t.uuid !== toolUuid));
        toast.success(t('agents.form.toolRemoved'));
      } catch (error) {
        console.error('Error removing tool:', error);
        const errorMessage =
          error && typeof error === 'object' && 'response' in error
            ? (error.response as { data?: { detail?: string } })?.data?.detail
            : undefined;
        toast.error(errorMessage || t('errors.generic'));
      }
    },
    [agentId, setDraftTools, t]
  );

  const saveToolConfig = useCallback(
    async (toolUuid: string, config: ToolParametersConfig) => {
      if (!agentId) return;

      try {
        const updated = await agentApi.updateDraftTool(agentId, toolUuid, {
          config: config,
        });
        setDraftTools((prev) =>
          prev.map((t) => (t.uuid === updated.uuid ? updated : t))
        );
        toast.success(t('agents.form.toolConfigUpdated'));
        // Note: Tool config is saved immediately via API, so no need for auto-save
        // The toast notification confirms the save
      } catch (error) {
        console.error('Error updating tool config:', error);
        const errorMessage =
          error && typeof error === 'object' && 'response' in error
            ? (error.response as { data?: { detail?: string } })?.data?.detail
            : undefined;
        toast.error(errorMessage || t('errors.generic'));
      }
    },
    [agentId, setDraftTools, t]
  );

  return {
    editingTool,
    setEditingTool,
    addTool,
    removeTool,
    saveToolConfig,
  };
};
