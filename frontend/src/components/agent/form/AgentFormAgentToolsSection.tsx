import React, { useState, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { PlusIcon } from '@heroicons/react/24/outline';

import DropdownMenu from '../DropdownMenu';
import EmptyState from '../EmptyState';
import ListItem from '../ListItem';
import SectionHeader from '../SectionHeader';

import type { Agent, AgentAsTool } from '../../../types/agent';

interface AgentFormAgentToolsSectionProps {
  draftAgentTools: AgentAsTool[];
  availableAgents: Agent[];
  currentAgentUuid: string;
  onAdd: (agentUuid: string) => Promise<void>;
  onRemove: (agentToolUuid: string) => Promise<void>;
  onConfigure?: (agentTool: AgentAsTool) => void;
}

const AgentFormAgentToolsSection: React.FC<AgentFormAgentToolsSectionProps> = ({
  draftAgentTools,
  availableAgents,
  currentAgentUuid,
  onAdd,
  onRemove,
  onConfigure,
}) => {
  const { t } = useTranslation();
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  const availableToolAgents = useMemo(
    () =>
      availableAgents.filter(
        (agent) =>
          agent.uuid !== currentAgentUuid && // Exclude self
          !draftAgentTools.some((dat) => dat.tool_agent_uuid === agent.uuid) // Exclude already added
      ),
    [availableAgents, draftAgentTools, currentAgentUuid]
  );

  return (
    <div>
      <SectionHeader
        title={t('agents.form.agentTools')}
        rightContent={
          availableToolAgents.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAgentSelector(!showAgentSelector)}
                className="inline-flex items-center gap-x-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
              >
                <PlusIcon className="h-3 w-3" />
                {t('common.add')}
              </button>
              {showAgentSelector && (
                <DropdownMenu
                  items={availableToolAgents.map((agent) => ({
                    key: agent.uuid,
                    label: agent.name,
                    description: `${t('agents.status.' + agent.status)} - ${t('common.agent')}`,
                  }))}
                  onSelect={(key) => {
                    onAdd(key);
                    setShowAgentSelector(false);
                  }}
                  width="w-64"
                  maxHeight="max-h-64 overflow-y-auto"
                />
              )}
            </div>
          )
        }
      />
      {draftAgentTools.length > 0 ? (
        <div className="space-y-1">
          {draftAgentTools.map((agentTool) => (
            <ListItem
              key={agentTool.uuid}
              label={agentTool.name}
              onConfigure={onConfigure ? () => onConfigure(agentTool) : undefined}
              onDelete={() => onRemove(agentTool.uuid)}
              configureTitle={t('common.config')}
            />
          ))}
        </div>
      ) : (
        <EmptyState message={t('agents.form.noAgentTools')} />
      )}
    </div>
  );
};

export default AgentFormAgentToolsSection;
