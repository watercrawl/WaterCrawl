import { useState, useEffect, useRef, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, ArrowPathIcon, LockOpenIcon, ArrowPathRoundedSquareIcon, CommandLineIcon, InformationCircleIcon, ShieldCheckIcon, ServerStackIcon, PencilIcon } from '@heroicons/react/24/outline';

import Button from '../shared/Button';
import Loading from '../shared/Loading';
import Modal from '../shared/Modal';
import ToolCard from '../shared/ToolCard';

import { useConfirm } from '../../contexts/ConfirmContext';
import { toolsApi } from '../../services/api/tools';

import type { MCPServer, MCPServerCreateRequest, MCPServerParameters, ToolParameterType } from '../../types/tools';

const MCPServersTab: React.FC = () => {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
  const [editingServer, setEditingServer] = useState<MCPServer | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [serverName, setServerName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [transportType, setTransportType] = useState<'sse' | 'streamable_http'>('streamable_http');
  const [serverParameters, setServerParameters] = useState<MCPServerParameters[]>([]);
  const [creating, setCreating] = useState(false);

  // Parameter type options
  const parameterTypeOptions: { value: ToolParameterType; label: string }[] = [
    { value: 'header', label: t('tools.mcp.parameterTypes.header') },
    { value: 'query', label: t('tools.mcp.parameterTypes.query') },
    { value: 'path', label: t('tools.mcp.parameterTypes.path') },
  ];

  const fetchMcpServers = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const response = await toolsApi.listMcpServers();
      setMcpServers(response.results || []);
    } catch (error: any) {
      console.error('Error fetching MCP servers:', error);
      if (!silent) {
        toast.error(t('errors.generic'));
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    fetchMcpServers();

    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchMcpServers]);

  useEffect(() => {
    // Check if any servers have pending status
    const hasPending = mcpServers.some(server => server.status === 'pending');

    if (hasPending && !pollingIntervalRef.current) {
      // Start polling every 10 seconds (silent mode)
      pollingIntervalRef.current = setInterval(() => {
        fetchMcpServers(true);
      }, 5000);
    } else if (!hasPending && pollingIntervalRef.current) {
      // Stop polling if no pending servers
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, [mcpServers, fetchMcpServers]);

  // Extract {{VARIABLE}} patterns from URL
  const extractPathVariables = (url: string): string[] => {
    const pattern = /\{\{([^}]+)\}\}/g;
    const matches: string[] = [];
    let match;
    while ((match = pattern.exec(url)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  };

  // Get required parameter names from current URL
  const getRequiredParameterNames = (): Set<string> => {
    return new Set(extractPathVariables(serverUrl));
  };

  // Parse query params from URL and add as parameters
  // Also detect {{VARIABLE}} patterns and add as path parameters
  const handleUrlChange = (url: string) => {
    // First, detect path variables in the URL
    const pathVariables = extractPathVariables(url);
    
    // Add new path parameters for variables not already in params
    if (pathVariables.length > 0) {
      const existingParamNames = new Set(serverParameters.map(p => p.name));
      const newPathParams: MCPServerParameters[] = pathVariables
        .filter(name => !existingParamNames.has(name))
        .map(name => ({
          tool_parameter_type: 'path' as ToolParameterType,
          name,
          value: '',
        }));
      
      if (newPathParams.length > 0) {
        setServerParameters(prev => [...prev, ...newPathParams]);
        toast.success(t('tools.mcp.pathVariablesDetected', { count: newPathParams.length }));
      }
    }

    // Then handle query params extraction
    try {
      const urlObj = new URL(url);
      const queryParams = Array.from(urlObj.searchParams.entries());

      if (queryParams.length > 0) {
        // Remove query params from URL
        urlObj.search = '';
        setServerUrl(urlObj.toString());

        // Add query params as parameters
        const existingParamNames = new Set(serverParameters.map(p => p.name));
        const newParams: MCPServerParameters[] = queryParams
          .filter(([name]) => !existingParamNames.has(name))
          .map(([name, value]) => ({
            tool_parameter_type: 'query' as ToolParameterType,
            name,
            value,
          }));

        if (newParams.length > 0) {
          setServerParameters(prev => [...prev, ...newParams]);
          toast.success(t('tools.mcp.queryParamsExtracted', { count: newParams.length }));
        }
      } else {
        setServerUrl(url);
      }
    } catch {
      // Not a valid URL yet, just set it
      setServerUrl(url);
    }
  };

  // Parameter management functions
  const handleAddParameter = () => {
    setServerParameters(prev => [
      ...prev,
      { tool_parameter_type: 'header', name: '', value: '' },
    ]);
  };

  const handleRemoveParameter = (index: number) => {
    const param = serverParameters[index];
    const requiredNames = getRequiredParameterNames();
    
    // Prevent removing required path parameters
    if (requiredNames.has(param.name)) {
      toast.error(t('tools.mcp.cannotRemoveRequiredParam', { name: param.name }));
      return;
    }
    
    setServerParameters(prev => prev.filter((_, i) => i !== index));
  };

  const handleParameterChange = (
    index: number,
    field: keyof MCPServerParameters,
    value: string
  ) => {
    setServerParameters(prev =>
      prev.map((param, i) =>
        i === index ? { ...param, [field]: value } : param
      )
    );
  };

  const resetCreateModal = () => {
    setServerName('');
    setServerUrl('');
    setTransportType('streamable_http');
    setServerParameters([]);
    setEditingServer(null);
  };

  const handleEditClick = (server: MCPServer) => {
    setEditingServer(server);
    setServerName(server.name);
    setServerUrl(server.url);
    setTransportType(server.transport_type);
    setServerParameters(server.parameters.map(p => ({
      tool_parameter_type: p.tool_parameter_type,
      name: p.name,
      value: ''
    })));
    setShowCreateModal(true);
  };

  const handleCreateMcpServer = async () => {
    if (!serverName.trim() || !serverUrl.trim()) {
      toast.error(t('tools.mcp.fillRequired'));
      return;
    }

    // Validate parameters - all must have name
    const invalidNames = serverParameters.some(p => !p.name.trim());
    if (invalidNames) {
      toast.error(t('tools.mcp.fillAllParameters'));
      return;
    }

    // Value is only required in creation mode
    if (!editingServer) {
      const invalidValues = serverParameters.some(p => !p.value || !p.value.trim());
      if (invalidValues) {
        toast.error(t('tools.mcp.fillAllParameters'));
        return;
      }
    }

    // Check all required path parameters are filled
    const requiredNames = getRequiredParameterNames();
    const missingRequired = Array.from(requiredNames).filter(name => {
      const param = serverParameters.find(p => p.name === name);
      // Only require value if NOT in editing mode or if the parameter is being newly added/modified in edit mode
      // For simplicity, in edit mode we only enforce value if it's explicitly provided or if it's a new parameter
      if (!editingServer) {
        return !param || !param.value || !param.value.trim();
      }
      // In edit mode, we allow empty values to preserve secrets, 
      // but the parameter itself must exist in the list if it's required by the URL
      return !param;
    });
    
    if (missingRequired.length > 0) {
      toast.error(t('tools.mcp.missingRequiredParams', { params: missingRequired.join(', ') }));
      return;
    }

    setCreating(true);
    try {
      const request: MCPServerCreateRequest = {
        name: serverName.trim(),
        url: serverUrl.trim(),
        transport_type: transportType,
        parameters: serverParameters.length > 0
          ? serverParameters.map(p => ({
            tool_parameter_type: p.tool_parameter_type,
            name: p.name.trim(),
            value: p.value ? p.value.trim() : null,
          }))
          : undefined,
      };

      if (editingServer) {
        await toolsApi.updateMcpServer(editingServer.uuid, request);
        toast.success(t('tools.mcp.updateSuccess'));
      } else {
        await toolsApi.createMcpServer(request);
        toast.success(t('tools.mcp.createSuccess'));
      }
      
      setShowCreateModal(false);
      resetCreateModal();
      fetchMcpServers();
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || t('errors.badRequest'));
      } else {
        console.error('Error saving MCP server:', error);
        toast.error(error.response?.data?.detail || t('errors.generic'));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMcpServer = (uuid: string, name: string) => {
    confirm({
      title: t('tools.mcp.confirmDelete'),
      message: t('tools.mcp.confirmDeleteMessage', { name }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await toolsApi.deleteMcpServer(uuid);
          toast.success(t('tools.mcp.deleteSuccess'));
          fetchMcpServers();
        } catch (error: any) {
          console.error('Error deleting MCP server:', error);
          toast.error(error.response?.data?.detail || t('errors.generic'));
        }
      },
    });
  };

  const handleAuthorize = async (uuid: string) => {
    try {
      const response = await toolsApi.getRedirectUrl(uuid);
      // Open OAuth URL in new window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        response.redirect_url,
        'oauth-popup',
        `width=${width},height=${height},left=${left},top=${top},popup=yes,scrollbars=yes`
      );

      if (!popup) {
        // Fallback to new tab if popup blocked
        window.open(response.redirect_url, '_blank');
        toast.success(t('tools.mcp.authWindowOpened'));
        return;
      }

      // Listen for popup close and reload MCP servers
      const popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheckInterval);
          // Reload MCP servers after OAuth completion
          fetchMcpServers(true);
          toast.success(t('tools.mcp.authCompleted'));
        }
      }, 500); // Check every 500ms

      toast.success(t('tools.mcp.authWindowOpened'));
    } catch (error: any) {
      console.error('Error getting OAuth URL:', error);
      toast.error(error.response?.data?.detail || t('errors.generic'));
    }
  };

  const handleRevalidate = (uuid: string, name: string) => {
    confirm({
      title: t('tools.mcp.confirmRevalidate'),
      message: t('tools.mcp.confirmRevalidateMessage', { name }),
      confirmText: t('tools.mcp.revalidate'),
      cancelText: t('common.cancel'),
      variant: 'warning',
      onConfirm: async () => {
        try {
          await toolsApi.revalidateMcpServer(uuid);
          toast.success(t('tools.mcp.revalidateSuccess'));
          fetchMcpServers();
        } catch (error: any) {
          console.error('Error revalidating MCP server:', error);
          toast.error(error.response?.data?.detail || t('errors.generic'));
        }
      },
    });
  };

  const toggleExpand = (uuid: string) => {
    setExpandedServers(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  const getStatusBadge = (status: MCPServer['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center rounded-md bg-success-soft px-2 py-1 text-xs font-medium text-success">
            {t('tools.mcp.status.active')}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-x-1 rounded-md bg-warning-soft px-2 py-1 text-xs font-medium text-warning">
            <ArrowPathIcon className="h-3 w-3 animate-spin" />
            {t('tools.mcp.status.pending')}
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center rounded-md bg-destructive-soft px-2 py-1 text-xs font-medium text-destructive">
            {t('tools.mcp.status.error')}
          </span>
        );
      case 'auth_required':
        return (
          <span className="inline-flex items-center rounded-md bg-info-soft px-2 py-1 text-xs font-medium text-info">
            {t('tools.mcp.status.authRequired')}
          </span>
        );
      case 'oauth_required':
        return (
          <span className="inline-flex items-center rounded-md bg-warning-soft px-2 py-1 text-xs font-medium text-warning">
            {t('tools.mcp.status.oauthRequired')}
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      {/* Add MCP Server Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          <PlusIcon className="h-4 w-4" />
          {t('tools.mcp.addServer')}
        </button>
      </div>

      {/* MCP Servers List */}
      {mcpServers.length > 0 ? (
        <div className="space-y-3">
          {mcpServers.map(server => {
            const isExpanded = expandedServers.has(server.uuid);
            return (
              <div
                key={server.uuid}
                className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
              >
                {/* Header - Clickable */}
                <button
                  onClick={() => toggleExpand(server.uuid)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-x-3">
                    {isExpanded ? (
                      <ChevronDownIcon className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="text-left">
                      <div className="flex items-center gap-x-2">
                        <h3 className="text-base font-semibold text-foreground">{server.name}</h3>
                        {getStatusBadge(server.status)}
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border border-border">
                          {server.transport_type === 'sse' ? 'SSE' : 'Streamable HTTP'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{server.url}</p>
                      <p className="text-xs text-muted-foreground">
                        {server.tools.length} {server.tools.length === 1 ? t('tools.tool') : t('tools.tools')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-x-2">
                    {/* OAuth Authorize Button */}
                    {server.status === 'oauth_required' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAuthorize(server.uuid);
                        }}
                        className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
                        title={t('tools.mcp.authorize')}
                      >
                        <LockOpenIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('tools.mcp.authorize')}</span>
                      </button>
                    )}

                    {/* Edit Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(server);
                      }}
                      className="rounded-md p-2 text-muted-foreground hover:bg-muted transition-colors"
                      title={t('common.edit')}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>

                    {/* Revalidate Button */}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRevalidate(server.uuid, server.name);
                      }}
                      className="rounded-md p-2 text-muted-foreground hover:bg-muted transition-colors"
                      title={t('tools.mcp.revalidate')}
                    >
                      <ArrowPathRoundedSquareIcon className="h-4 w-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMcpServer(server.uuid, server.name);
                      }}
                      className="rounded-md p-2 text-destructive hover:bg-destructive/10 transition-colors"
                      title={t('common.delete')}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 px-4 py-3">
                    {server.status === 'error' && server.error_message && (
                      <div className="mb-3 rounded-md bg-destructive-soft p-3">
                        <p className="text-sm font-medium text-destructive">{t('tools.mcp.error')}</p>
                        <p className="text-xs text-destructive mt-1">{server.error_message}</p>
                      </div>
                    )}

                    {server.tools.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-x-2">
                          <CommandLineIcon className="h-4 w-4 text-primary" />
                          {t('tools.mcp.availableTools')} ({server.tools.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {server.tools.map(tool => (
                            <ToolCard
                              key={tool.uuid}
                              name={tool.name}
                              description={tool.description}
                              toolKey={tool.key}
                              variant="viewable"
                              toolUuid={tool.uuid}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {server.status === 'pending'
                          ? t('tools.mcp.discoveringTools')
                          : t('tools.mcp.noTools')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card p-12">
          <h3 className="mt-4 text-lg font-semibold text-foreground">{t('tools.mcp.noServers')}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t('tools.mcp.noServersDescription')}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 inline-flex items-center gap-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            <PlusIcon className="h-4 w-4" />
            {t('tools.mcp.addServer')}
          </button>
        </div>
      )}

      {/* Create MCP Server Modal */}
      <Modal
        isOpen={showCreateModal}
        size="xl"
        onClose={() => {
          setShowCreateModal(false);
          resetCreateModal();
        }}
        title={editingServer ? t('tools.mcp.editTitle') : t('tools.mcp.createTitle')}
        icon={ServerStackIcon}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetCreateModal();
              }}
              disabled={creating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateMcpServer}
              disabled={creating}
            >
              {creating ? t('common.saving') : (editingServer ? t('common.save') : t('common.create'))}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('tools.mcp.serverName')}
            </label>
            <input
              type="text"
              value={serverName}
              onChange={e => setServerName(e.target.value)}
              className="block w-full rounded-lg border border-input-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={t('tools.mcp.serverNamePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('tools.mcp.serverUrl')}
            </label>
            <input
              type="url"
              value={serverUrl}
              onChange={e => handleUrlChange(e.target.value)}
              className="block w-full rounded-lg border border-input-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="https://mcp.example.com"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t('tools.mcp.serverUrlHelp')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t('tools.mcp.transportType')}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTransportType('streamable_http')}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all border ${
                  transportType === 'streamable_http'
                    ? 'bg-primary/10 border-primary text-primary shadow-sm'
                    : 'bg-background border-input-border text-muted-foreground hover:border-muted-foreground hover:bg-muted/50'
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${transportType === 'streamable_http' ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'}`} />
                Streamable HTTP
              </button>
              <button
                type="button"
                onClick={() => setTransportType('sse')}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all border ${
                  transportType === 'sse'
                    ? 'bg-primary/10 border-primary text-primary shadow-sm'
                    : 'bg-background border-input-border text-muted-foreground hover:border-muted-foreground hover:bg-muted/50'
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${transportType === 'sse' ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'}`} />
                SSE
              </button>
            </div>
          </div>

          {/* Path Variable Hint */}
          <div className="rounded-lg bg-info-soft/50 border border-info/20 p-3">
            <div className="flex gap-2">
              <InformationCircleIcon className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
              <div className="text-xs text-foreground space-y-1">
                <p className="font-medium">{t('tools.mcp.pathVariableHintTitle')}</p>
                <p className="text-muted-foreground">{t('tools.mcp.pathVariableHintDescription')}</p>
                <code className="block mt-1 px-2 py-1 bg-muted rounded text-xs font-mono">
                  https://api.example.com/{'{{API_KEY}}'}/endpoint
                </code>
              </div>
            </div>
          </div>

          {/* Parameters Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">
                {t('tools.mcp.parameters')}
              </label>
              <button
                type="button"
                onClick={handleAddParameter}
                className="inline-flex items-center gap-x-1 text-xs font-medium text-primary hover:text-primary-hover"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                {t('tools.mcp.addParameter')}
              </button>
            </div>

            {serverParameters.length === 0 ? (
              <div className="rounded-lg bg-primary-soft/50 border border-primary/20 p-3">
                <div className="flex gap-2">
                  <ShieldCheckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-foreground space-y-1">
                    <p className="font-medium">{t('tools.mcp.securityHintTitle')}</p>
                    <p className="text-muted-foreground">{t('tools.mcp.securityHintDescription')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {serverParameters.map((param, index) => {
                  const isRequired = getRequiredParameterNames().has(param.name);
                  const isOAuth = param.tool_parameter_type === 'oauth';
                  
                  if (isOAuth) {
                    return (
                      <div key={index} className="rounded-lg bg-warning-soft/30 border border-warning/20 p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 p-2 bg-warning-soft rounded-lg">
                            <ShieldCheckIcon className="h-5 w-5 text-warning" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-semibold text-foreground">
                                {t('tools.mcp.oauthWarning')}
                              </h4>
                              <button
                                type="button"
                                onClick={() => handleRemoveParameter(index)}
                                className="text-destructive hover:text-destructive-hover transition-colors"
                                title={t('common.remove')}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {t('tools.mcp.oauthWarningDescription')}
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                              <span className="inline-flex items-center rounded-md bg-warning-soft px-2 py-0.5 text-[10px] font-medium text-warning uppercase border border-warning/20">
                                {t('tools.mcp.status.active')}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {param.name}: ********
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={index}
                      className={`rounded-lg border p-3 ${
                        isRequired 
                          ? 'border-warning/50 bg-warning-soft/30' 
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      {/* Required Badge */}
                      {isRequired && (
                        <div className="flex items-center gap-1 mb-2">
                          <span className="inline-flex items-center rounded-md bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
                            {t('tools.mcp.required')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t('tools.mcp.requiredFromUrl')}
                          </span>
                        </div>
                      )}

                      {/* First Row: Name and Type */}
                      <div className="flex items-start gap-2 mb-2">
                        {/* Name Input */}
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            {t('tools.mcp.parameterName')}
                          </label>
                          <input
                            type="text"
                            value={param.name}
                            onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                            disabled={param.tool_parameter_type === 'oauth'}
                            placeholder={t('tools.mcp.parameterNamePlaceholder')}
                            className="block w-full rounded-lg border border-input-border bg-input px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Type Select */}
                        <div className="w-28 flex-shrink-0">
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            {t('tools.mcp.parameterType')}
                          </label>
                          <select
                            value={param.tool_parameter_type}
                            onChange={(e) => handleParameterChange(index, 'tool_parameter_type', e.target.value as ToolParameterType)}
                            disabled={param.tool_parameter_type === 'oauth'}
                            className="block w-full rounded-lg border border-input-border bg-input px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {parameterTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                            {param.tool_parameter_type === 'oauth' && (
                              <option value="oauth">OAuth</option>
                            )}
                          </select>
                        </div>

                        {/* Remove Button */}
                        <div className="flex-shrink-0 pt-5">
                          <button
                            type="button"
                            onClick={() => handleRemoveParameter(index)}
                            disabled={isRequired}
                            className={`rounded p-1 transition-colors ${
                              isRequired
                                ? 'text-muted-foreground cursor-not-allowed'
                                : 'text-destructive hover:bg-destructive/10'
                            }`}
                            title={isRequired ? t('tools.mcp.cannotRemoveRequired') : t('common.remove')}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Second Row: Value */}
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          {t('tools.mcp.parameterValue')}
                          {(isRequired && !editingServer) && <span className="text-warning ms-1">*</span>}
                          {editingServer && <span className="text-[10px] text-muted-foreground ms-1 font-normal">({t('common.optional')})</span>}
                        </label>
                        <input
                          type="text"
                          value={param.value ?? ''}
                          onChange={e =>
                            handleParameterChange(index, 'value', e.target.value)
                          }
                          disabled={param.tool_parameter_type === 'oauth'}
                          className={`block w-full rounded-lg border px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-input ${
                            isRequired && (!param.value || !param.value.trim())
                              ? 'border-warning'
                              : 'border-input-border'
                          } ${param.tool_parameter_type === 'oauth' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          placeholder={t('tools.mcp.parameterValuePlaceholder')}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MCPServersTab;
