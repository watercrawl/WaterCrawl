import { useState, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { agentApi } from '../services/api/agent';

import type { AgentKnowledgeBase, ToolParametersConfig } from '../types/agent';

interface UseAgentKnowledgeBasesReturn {
  editingKnowledgeBase: AgentKnowledgeBase | null;
  setEditingKnowledgeBase: (kb: AgentKnowledgeBase | null) => void;
  addKnowledgeBase: (kbUuid: string) => Promise<void>;
  removeKnowledgeBase: (kbUuid: string) => Promise<void>;
  saveKnowledgeBaseConfig: (config: ToolParametersConfig) => Promise<void>;
}

export const useAgentKnowledgeBases = (
  agentId: string | undefined,
  setDraftKnowledgeBases: React.Dispatch<React.SetStateAction<AgentKnowledgeBase[]>>
): UseAgentKnowledgeBasesReturn => {
  const { t } = useTranslation();
  const [editingKnowledgeBase, setEditingKnowledgeBase] = useState<AgentKnowledgeBase | null>(null);

  const addKnowledgeBase = useCallback(
    async (kbUuid: string) => {
      if (!agentId) return;

      try {
        const newKb = await agentApi.addDraftKnowledgeBase(agentId, {
          knowledge_base_uuid: kbUuid,
          config: {},
        });
        setDraftKnowledgeBases((prev) => [...prev, newKb]);
        toast.success(t('agents.form.kbAdded'));
      } catch (error) {
        console.error('Error adding knowledge base:', error);
        const errorMessage =
          error && typeof error === 'object' && 'response' in error
            ? (error.response as { data?: { detail?: string } })?.data?.detail
            : undefined;
        toast.error(errorMessage || t('errors.generic'));
      }
    },
    [agentId, setDraftKnowledgeBases, t]
  );

  const removeKnowledgeBase = useCallback(
    async (kbUuid: string) => {
      if (!agentId) return;

      try {
        await agentApi.removeDraftKnowledgeBase(agentId, kbUuid);
        setDraftKnowledgeBases((prev) => prev.filter((kb) => kb.uuid !== kbUuid));
        toast.success(t('agents.form.kbRemoved'));
      } catch (error) {
        console.error('Error removing knowledge base:', error);
        const errorMessage =
          error && typeof error === 'object' && 'response' in error
            ? (error.response as { data?: { detail?: string } })?.data?.detail
            : undefined;
        toast.error(errorMessage || t('errors.generic'));
      }
    },
    [agentId, setDraftKnowledgeBases, t]
  );

  const saveKnowledgeBaseConfig = useCallback(
    async (config: ToolParametersConfig) => {
      if (!agentId || !editingKnowledgeBase) return;

      try {
        const updated = await agentApi.updateDraftKnowledgeBase(agentId, editingKnowledgeBase.uuid, {
          config: config as Record<string, any>,
        });
        setDraftKnowledgeBases((prev) =>
          prev.map((kb) => (kb.uuid === updated.uuid ? updated : kb))
        );
        setEditingKnowledgeBase(null);
        toast.success(t('agents.form.kbConfigUpdated'));
      } catch (error) {
        console.error('Error updating knowledge base config:', error);
        const errorMessage =
          error && typeof error === 'object' && 'response' in error
            ? (error.response as { data?: { detail?: string } })?.data?.detail
            : undefined;
        toast.error(errorMessage || t('errors.generic'));
      }
    },
    [agentId, editingKnowledgeBase, setDraftKnowledgeBases, t]
  );

  return {
    editingKnowledgeBase,
    setEditingKnowledgeBase,
    addKnowledgeBase,
    removeKnowledgeBase,
    saveKnowledgeBaseConfig,
  };
};
