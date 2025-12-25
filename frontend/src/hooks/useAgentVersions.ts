import { useState, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { agentApi } from '../services/api/agent';

import type { AgentVersionListItem } from '../types/agent';

interface UseAgentVersionsReturn {
  showVersionHistory: boolean;
  versions: AgentVersionListItem[];
  setShowVersionHistory: (show: boolean) => void;
  loadVersionHistory: () => Promise<void>;
  revertToVersion: (versionUuid: string) => Promise<void>;
}

export const useAgentVersions = (
  agentId: string | undefined,
  loadDraft: () => Promise<void>
): UseAgentVersionsReturn => {
  const { t } = useTranslation();
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versions, setVersions] = useState<AgentVersionListItem[]>([]);

  const loadVersionHistory = useCallback(async () => {
    if (!agentId) return;

    try {
      const response = await agentApi.listVersions(agentId);
      setVersions(response.results);
      setShowVersionHistory(true);
    } catch (error) {
      console.error('Error loading versions:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error.response as { data?: { message?: string } })?.data?.message
          : undefined;
      toast.error(errorMessage || t('errors.generic'));
    }
  }, [agentId, t]);

  const revertToVersion = useCallback(
    async (versionUuid: string) => {
      if (!agentId) return;

      try {
        await agentApi.revertDraft(agentId, { version_uuid: versionUuid });
        toast.success(t('agents.form.revertSuccess'));
        setShowVersionHistory(false);
        loadDraft(); // Reload draft
      } catch (error) {
        console.error('Error reverting version:', error);
        const errorMessage =
          error && typeof error === 'object' && 'response' in error
            ? (error.response as { data?: { detail?: string } })?.data?.detail
            : undefined;
        toast.error(errorMessage || t('errors.generic'));
      }
    },
    [agentId, loadDraft, t]
  );

  return {
    showVersionHistory,
    versions,
    setShowVersionHistory,
    loadVersionHistory,
    revertToVersion,
  };
};
