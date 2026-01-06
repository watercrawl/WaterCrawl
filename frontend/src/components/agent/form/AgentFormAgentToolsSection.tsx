import React, { useState, useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import { PlusIcon } from '@heroicons/react/24/outline';

import { agentApi } from '../../../services/api/agent';
import Modal from '../../shared/Modal';
import EmptyState from '../EmptyState';
import ListItem from '../ListItem';
import SectionHeader from '../SectionHeader';
import UniversalSelector from '../UniversalSelector';

import type { Agent, AgentAsTool } from '../../../types/agent';

interface AgentFormAgentToolsSectionProps {
  draftAgentTools: AgentAsTool[];
  currentAgentUuid: string;
  onAdd: (agentUuid: string) => Promise<void>;
  onRemove: (agentToolUuid: string) => Promise<void>;
  onConfigure?: (agentTool: AgentAsTool) => void;
}

const AgentFormAgentToolsSection: React.FC<AgentFormAgentToolsSectionProps> = ({
  draftAgentTools,
  currentAgentUuid,
  onAdd,
  onRemove,
  onConfigure,
}) => {
  const { t } = useTranslation();
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  const fetchAgents = useCallback(async (page: number, search: string) => {
    const response = await agentApi.list(page, 10, search, { status: 'published' });
    return {
      results: response.results
        .filter((agent: Agent) => agent.uuid !== currentAgentUuid)
        .map((agent: Agent) => ({
          uuid: agent.uuid,
          title: agent.name,
          description: `${t('agents.status.' + agent.status)} - ${t('common.agent')}`,
        })),
      count: response.count,
    };
  }, [currentAgentUuid, t]);

  const handleAdd = async (agentUuid: string) => {
    await onAdd(agentUuid);
    setShowAgentSelector(false);
  };

  return (
    <div>
      <SectionHeader
        title={t('agents.form.agentTools')}
        rightContent={
          <button
            type="button"
            onClick={() => setShowAgentSelector(true)}
            className="inline-flex items-center gap-x-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
          >
            <PlusIcon className="h-3 w-3" />
            {t('common.add')}
          </button>
        }
      />
      <div className="rounded-md border border-input-border bg-card p-3">
        {draftAgentTools.length > 0 ? (
          <div className="space-y-1">
            {draftAgentTools.map((agentTool) => (
              <ListItem
                key={agentTool.uuid}
                label={agentTool.name}
                onConfigure={onConfigure ? () => onConfigure(agentTool) : undefined}
                onDelete={() => onRemove(agentTool.uuid)}
              />
            ))}
          </div>
        ) : (
          <EmptyState message={t('agents.form.noAgentTools')} />
        )}
      </div>

      <Modal
        isOpen={showAgentSelector}
        onClose={() => setShowAgentSelector(false)}
        title={t('agents.form.addAgentTool')}
        size="xl"
      >
        <UniversalSelector
          onSelect={handleAdd}
          selectedUuids={draftAgentTools.map((at) => at.tool_agent_uuid)}
          fetchData={fetchAgents}
          searchPlaceholder={t('agents.searchPlaceholder')}
          emptyMessage={t('agents.noAgentsFound')}
        />
      </Modal>
    </div>
  );
};

export default AgentFormAgentToolsSection;
