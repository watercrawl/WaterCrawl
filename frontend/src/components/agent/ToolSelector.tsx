import { useState, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import {
  ChevronDownIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  ServerIcon,
  PuzzlePieceIcon,
  MagnifyingGlassIcon,
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
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter tools based on search query
  const filteredBuiltInTools = useMemo(() => {
    if (!searchQuery.trim()) return builtInTools;
    const query = searchQuery.toLowerCase();
    return builtInTools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description?.toLowerCase().includes(query) ||
        tool.key.toLowerCase().includes(query)
    );
  }, [builtInTools, searchQuery]);

  const filteredApiSpecs = useMemo(() => {
    if (!searchQuery.trim()) return apiSpecs;
    const query = searchQuery.toLowerCase();
    return apiSpecs
      .map((spec) => ({
        ...spec,
        tools: spec.tools.filter(
          (tool) =>
            tool.name.toLowerCase().includes(query) ||
            tool.description?.toLowerCase().includes(query) ||
            tool.key.toLowerCase().includes(query)
        ),
      }))
      .filter((spec) => spec.tools.length > 0 || spec.name.toLowerCase().includes(query));
  }, [apiSpecs, searchQuery]);

  const filteredMcpServers = useMemo(() => {
    if (!searchQuery.trim()) return mcpServers;
    const query = searchQuery.toLowerCase();
    return mcpServers
      .map((server) => ({
        ...server,
        tools: server.tools.filter(
          (tool) =>
            tool.name.toLowerCase().includes(query) ||
            tool.description?.toLowerCase().includes(query) ||
            tool.key.toLowerCase().includes(query)
        ),
      }))
      .filter((server) => server.tools.length > 0 || server.name.toLowerCase().includes(query));
  }, [mcpServers, searchQuery]);

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('tools.searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

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
          {filteredBuiltInTools.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-semibold">
              {filteredBuiltInTools.length}
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
          {filteredApiSpecs.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-semibold">
              {filteredApiSpecs.length}
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
          {filteredMcpServers.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-semibold">
              {filteredMcpServers.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {/* Built-in Tools Tab */}
        {activeTab === 'builtin' && (
          <div className="space-y-1.5">
            {filteredBuiltInTools.length > 0 ? (
              filteredBuiltInTools.map(tool => (
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
            {filteredApiSpecs.length > 0 ? (
              filteredApiSpecs.map(spec => {
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
            {filteredMcpServers.length > 0 ? (
              filteredMcpServers.map(server => {
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
