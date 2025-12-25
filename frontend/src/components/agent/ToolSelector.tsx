import { useState } from 'react';

import { useTranslation } from 'react-i18next';

import {
  ChevronDownIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  ServerIcon,
  PuzzlePieceIcon,
} from '@heroicons/react/24/outline';

import ToolCard from '../shared/ToolCard';

import type { ToolListItem, APISpec, MCPServer } from '../../types/tools';

interface ToolSelectorProps {
  builtInTools: ToolListItem[];
  apiSpecs: APISpec[];
  mcpServers: MCPServer[];
  onSelectTool: (toolUuid: string) => void;
  selectedToolUuids: string[];
}

const ToolSelector: React.FC<ToolSelectorProps> = ({
  builtInTools,
  apiSpecs,
  mcpServers,
  onSelectTool,
  selectedToolUuids,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'builtin' | 'custom' | 'mcp'>('builtin');
  const [expandedApiSpecs, setExpandedApiSpecs] = useState<Set<string>>(new Set());
  const [expandedMcpServers, setExpandedMcpServers] = useState<Set<string>>(new Set());

  const toggleApiSpec = (uuid: string) => {
    setExpandedApiSpecs(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  const toggleMcpServer = (uuid: string) => {
    setExpandedMcpServers(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  const isToolSelected = (toolUuid: string) => selectedToolUuids.includes(toolUuid);

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setActiveTab('builtin')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors border-b-2 ${
            activeTab === 'builtin'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <PuzzlePieceIcon className="h-4 w-4" />
          {t('tools.tabs.builtin')}
          {builtInTools.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-semibold">
              {builtInTools.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors border-b-2 ${
            activeTab === 'custom'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CodeBracketIcon className="h-4 w-4" />
          {t('tools.tabs.apiSpecs')}
          {apiSpecs.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-semibold">
              {apiSpecs.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('mcp')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors border-b-2 ${
            activeTab === 'mcp'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ServerIcon className="h-4 w-4" />
          {t('tools.tabs.mcpServers')}
          {mcpServers.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-semibold">
              {mcpServers.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {/* Built-in Tools Tab */}
        {activeTab === 'builtin' && (
          <div className="space-y-1.5">
            {builtInTools.length > 0 ? (
              builtInTools.map(tool => (
                  <ToolCard
                    key={tool.uuid}
                    name={tool.name}
                    description={tool.description}
                  toolKey={tool.key}
                    variant="selectable"
                    isSelected={isToolSelected(tool.uuid)}
                    onSelect={() => onSelectTool(tool.uuid)}
                    disabled={isToolSelected(tool.uuid)}
                  size="sm"
                  showKey={true}
                  />
              ))
            ) : (
              <div className="text-center py-12 text-sm text-muted-foreground">
                {t('tools.noBuiltInTools')}
              </div>
            )}
          </div>
        )}

        {/* API Specs Tab */}
        {activeTab === 'custom' && (
          <div className="space-y-2">
            {apiSpecs.length > 0 ? (
              apiSpecs.map(spec => {
                const isExpanded = expandedApiSpecs.has(spec.uuid);
                const selectedCount = spec.tools.filter(t => isToolSelected(t.uuid)).length;
                return (
                  <div key={spec.uuid} className="border border-border rounded-lg overflow-hidden bg-card">
                    {/* API Spec Header */}
                    <button
                      onClick={() => toggleApiSpec(spec.uuid)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <CodeBracketIcon className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="text-left flex-1 min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">{spec.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground">
                            {spec.tools.length} {spec.tools.length === 1 ? t('tools.tool') : t('tools.tools')}
                            </span>
                            {selectedCount > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success-soft text-success font-medium">
                                {selectedCount} {t('common.added')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDownIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>

                    {/* API Spec Tools */}
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/10 p-2 space-y-1.5">
                        {spec.tools.map(tool => (
                          <ToolCard
                            key={tool.uuid}
                            name={tool.name}
                            description={tool.description}
                            toolKey={tool.key}
                            method={tool.method}
                            path={tool.path}
                            variant="selectable"
                            isSelected={isToolSelected(tool.uuid)}
                            onSelect={() => onSelectTool(tool.uuid)}
                            disabled={isToolSelected(tool.uuid)}
                            size="sm"
                            showKey={true}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-sm text-muted-foreground">
                {t('tools.apiSpec.noSpecs')}
              </div>
            )}
          </div>
        )}

        {/* MCP Servers Tab */}
        {activeTab === 'mcp' && (
          <div className="space-y-2">
            {mcpServers.length > 0 ? (
              mcpServers.map(server => {
                const isExpanded = expandedMcpServers.has(server.uuid);
                const selectedCount = server.tools.filter(t => isToolSelected(t.uuid)).length;
                return (
                  <div key={server.uuid} className="border border-border rounded-lg overflow-hidden bg-card">
                    {/* MCP Server Header */}
                    <button
                      onClick={() => toggleMcpServer(server.uuid)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <ServerIcon className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="text-left flex-1 min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">{server.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground">
                            {server.tools.length} {server.tools.length === 1 ? t('tools.tool') : t('tools.tools')}
                            </span>
                            {selectedCount > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success-soft text-success font-medium">
                                {selectedCount} {t('common.added')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDownIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>

                    {/* MCP Server Tools */}
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/10 p-2 space-y-1.5">
                        {server.tools.map(tool => (
                          <ToolCard
                            key={tool.uuid}
                            name={tool.name}
                            description={tool.description}
                            toolKey={tool.key}
                            variant="selectable"
                            isSelected={isToolSelected(tool.uuid)}
                            onSelect={() => onSelectTool(tool.uuid)}
                            disabled={isToolSelected(tool.uuid)}
                            size="sm"
                            showKey={true}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-sm text-muted-foreground">
                {t('tools.mcp.noServers')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolSelector;
