import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { PlusIcon, TrashIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

import EmptyState from '../EmptyState';
import SectionHeader from '../SectionHeader';
import ToolParameterStrategyModal from '../ToolParameterStrategyModal';
import ToolSelector from '../ToolSelector';

import Modal from '../../shared/Modal';

import type { AgentTool, ToolParametersConfig } from '../../../types/agent';
import type { ToolListItem, APISpec, MCPServer } from '../../../types/tools';

interface AgentFormToolsSectionProps {
  agentId: string;
  draftTools: AgentTool[];
  builtInTools: ToolListItem[];
  apiSpecs: APISpec[];
  mcpServers: MCPServer[];
  onAddTool: (toolUuid: string) => Promise<void>;
  onRemoveTool: (toolUuid: string) => Promise<void>;
  onSaveToolConfig: (toolUuid: string, config: ToolParametersConfig) => Promise<void>;
}

const AgentFormToolsSection: React.FC<AgentFormToolsSectionProps> = ({
  agentId: _agentId,
  draftTools,
  builtInTools,
  apiSpecs,
  mcpServers,
  onAddTool,
  onRemoveTool,
  onSaveToolConfig,
}) => {
  const { t } = useTranslation();
  const [showToolSelector, setShowToolSelector] = useState(false);
  const [editingTool, setEditingTool] = useState<AgentTool | null>(null);

  const handleAddTool = async (toolUuid: string) => {
    await onAddTool(toolUuid);
    setShowToolSelector(false);
  };

  return (
    <>
      <div>
        <SectionHeader
          title={t('agents.form.toolsLabel')}
          rightContent={
            (builtInTools.length > 0 || apiSpecs.length > 0 || mcpServers.length > 0) && (
              <button
                type="button"
                onClick={() => setShowToolSelector(true)}
                className="inline-flex items-center gap-x-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
              >
                <PlusIcon className="h-3 w-3" />
                {t('common.add')}
              </button>
            )
          }
        />
        <div className="rounded-md border border-input-border bg-card p-3">
          {draftTools.length > 0 ? (
            <div className="space-y-2">
              {draftTools.map((tool) => (
                <div
                  key={tool.uuid}
                  className="flex items-center justify-between rounded-md border border-border bg-background p-3 hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{tool.tool.name}</div>
                    {tool.tool.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {tool.tool.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-x-2">
                    {tool.tool.input_schema && Object.keys(tool.tool.input_schema).length > 0 && (
                      <button
                        onClick={() => setEditingTool(tool)}
                        className="inline-flex items-center gap-x-1 rounded-md border border-input-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                        title={t('agents.form.configTool')}
                      >
                        <Cog6ToothIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveTool(tool.uuid)}
                      className="inline-flex items-center rounded-md p-1 text-error hover:bg-error-soft"
                      title={t('common.delete')}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message={t('agents.form.noTools')} />
          )}
        </div>
      </div>

      {/* Tool Selector Modal */}
      <Modal
        isOpen={showToolSelector}
        onClose={() => setShowToolSelector(false)}
        title={t('agents.form.addTool')}
        size="2xl"
      >
        <ToolSelector
          builtInTools={builtInTools}
          apiSpecs={apiSpecs}
          mcpServers={mcpServers}
          onSelectTool={handleAddTool}
          selectedToolUuids={draftTools.map((t) => t.tool.uuid)}
        />
      </Modal>

      {/* Tool Config Modal */}
      {editingTool && (
        <ToolParameterStrategyModal
          isOpen={!!editingTool}
          onClose={() => setEditingTool(null)}
          tool={editingTool}
          onSave={async (config) => {
            await onSaveToolConfig(editingTool.uuid, config);
            setEditingTool(null);
          }}
        />
      )}
    </>
  );
};

export default AgentFormToolsSection;
