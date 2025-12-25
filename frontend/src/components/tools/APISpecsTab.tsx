import { useState, useEffect, useRef, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, DocumentTextIcon, InformationCircleIcon, ShieldCheckIcon, ArrowUpTrayIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import yaml from 'js-yaml';

import Button from '../shared/Button';
import Loading from '../shared/Loading';
import Modal from '../shared/Modal';
import ToolCard from '../shared/ToolCard';

import { useConfirm } from '../../contexts/ConfirmContext';
import { toolsApi } from '../../services/api/tools';

import type { APISpec, APISpecCreateRequest, ToolParameterType } from '../../types/tools';

// Parameter without uuid for creation
interface APISpecParameterInput {
  tool_parameter_type: ToolParameterType;
  name: string;
  value: string;
}

const APISpecsTab: React.FC = () => {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [apiSpecs, setApiSpecs] = useState<APISpec[]>([]);
  const [expandedSpecs, setExpandedSpecs] = useState<Set<string>>(new Set());
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [specName, setSpecName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [specJson, setSpecJson] = useState('');
  const [specParameters, setSpecParameters] = useState<APISpecParameterInput[]>([]);
  const [creating, setCreating] = useState(false);
  const [specHasBaseUrl, setSpecHasBaseUrl] = useState(false);
  

  // Parameter type options
  const parameterTypeOptions: { value: ToolParameterType; label: string }[] = [
    { value: 'header', label: t('tools.mcp.parameterTypes.header') },
    { value: 'query', label: t('tools.mcp.parameterTypes.query') },
    { value: 'path', label: t('tools.mcp.parameterTypes.path') },
  ];

  const fetchApiSpecs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await toolsApi.listApiSpecs();
      setApiSpecs(response.results || []);
    } catch (error: any) {
      console.error('Error fetching API specs:', error);
      toast.error(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchApiSpecs();
  }, [fetchApiSpecs]);

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
    return new Set(extractPathVariables(baseUrl));
  };

  // Parse OpenAPI spec and extract base URL and security schemes
  const handleSpecJsonChange = (json: string) => {
    setSpecJson(json);

    try {
      const spec = JSON.parse(json);
      
      // Extract base URL from servers array (OpenAPI 3.x)
      if (spec.servers && Array.isArray(spec.servers) && spec.servers.length > 0) {
        const serverUrl = spec.servers[0].url;
        if (serverUrl && !baseUrl) {
          setBaseUrl(serverUrl);
          handleBaseUrlChange(serverUrl);
          toast.success(t('tools.apiSpec.baseUrlExtracted'));
        }
        setSpecHasBaseUrl(true);
      } else if (spec.host) {
        // OpenAPI 2.x (Swagger)
        const scheme = spec.schemes?.[0] || 'https';
        const basePath = spec.basePath || '';
        const serverUrl = `${scheme}://${spec.host}${basePath}`;
        if (!baseUrl) {
          setBaseUrl(serverUrl);
          handleBaseUrlChange(serverUrl);
          toast.success(t('tools.apiSpec.baseUrlExtracted'));
        }
        setSpecHasBaseUrl(true);
      } else {
        setSpecHasBaseUrl(false);
      }

      // Extract security schemes
      const securitySchemes = spec.components?.securitySchemes || spec.securityDefinitions || {};
      const existingParamNames = new Set(specParameters.map(p => p.name));
      const newSecurityParams: APISpecParameterInput[] = [];

      for (const [name, scheme] of Object.entries(securitySchemes)) {
        const schemeObj = scheme as Record<string, string>;
        
        // Skip if parameter already exists
        if (existingParamNames.has(name)) continue;

        if (schemeObj.type === 'apiKey') {
          // API Key authentication
          const paramType: ToolParameterType = 
            schemeObj.in === 'header' ? 'header' : 
            schemeObj.in === 'query' ? 'query' : 'header';
          
          newSecurityParams.push({
            tool_parameter_type: paramType,
            name: schemeObj.name || name,
            value: '',
          });
        } else if (schemeObj.type === 'http' && schemeObj.scheme === 'bearer') {
          // Bearer token authentication
          newSecurityParams.push({
            tool_parameter_type: 'header',
            name: 'Authorization',
            value: '',
          });
        } else if (schemeObj.type === 'oauth2' || schemeObj.type === 'openIdConnect') {
          // OAuth2 / OpenID - add Authorization header
          if (!existingParamNames.has('Authorization')) {
            newSecurityParams.push({
              tool_parameter_type: 'header',
              name: 'Authorization',
              value: '',
            });
          }
        }
      }

      if (newSecurityParams.length > 0) {
        setSpecParameters(prev => [...prev, ...newSecurityParams]);
        toast.success(t('tools.apiSpec.securityParamsExtracted', { count: newSecurityParams.length }));
      }
    } catch {
      // Invalid JSON, just store it - will be validated on submit
      setSpecHasBaseUrl(false);
    }
  };

  // Parse query params from URL and add as parameters
  // Also detect {{VARIABLE}} patterns and add as path parameters
  const handleBaseUrlChange = (url: string) => {
    // First, detect path variables in the URL
    const pathVariables = extractPathVariables(url);

    // Add new path parameters for variables not already in params
    if (pathVariables.length > 0) {
      const existingParamNames = new Set(specParameters.map(p => p.name));
      const newPathParams: APISpecParameterInput[] = pathVariables
        .filter(name => !existingParamNames.has(name))
        .map(name => ({
          tool_parameter_type: 'path' as ToolParameterType,
          name,
          value: '',
        }));

      if (newPathParams.length > 0) {
        setSpecParameters(prev => [...prev, ...newPathParams]);
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
        setBaseUrl(urlObj.toString());

        // Add query params as parameters
        const existingParamNames = new Set(specParameters.map(p => p.name));
        const newParams: APISpecParameterInput[] = queryParams
          .filter(([name]) => !existingParamNames.has(name))
          .map(([name, value]) => ({
            tool_parameter_type: 'query' as ToolParameterType,
            name,
            value,
          }));

        if (newParams.length > 0) {
          setSpecParameters(prev => [...prev, ...newParams]);
          toast.success(t('tools.mcp.queryParamsExtracted', { count: newParams.length }));
        }
      } else {
        setBaseUrl(url);
      }
    } catch {
      // Not a valid URL yet, just set it
      setBaseUrl(url);
    }
  };

  // Parameter management functions
  const handleAddParameter = () => {
    setSpecParameters(prev => [
      ...prev,
      { tool_parameter_type: 'header', name: '', value: '' },
    ]);
  };

  const handleRemoveParameter = (index: number) => {
    const param = specParameters[index];
    const requiredNames = getRequiredParameterNames();

    // Prevent removing required path parameters
    if (requiredNames.has(param.name)) {
      toast.error(t('tools.mcp.cannotRemoveRequiredParam', { name: param.name }));
      return;
    }

    setSpecParameters(prev => prev.filter((_, i) => i !== index));
  };

  const handleParameterChange = (
    index: number,
    field: keyof APISpecParameterInput,
    value: string
  ) => {
    setSpecParameters(prev =>
      prev.map((param, i) =>
        i === index ? { ...param, [field]: value } : param
      )
    );
  };

  const resetCreateModal = () => {
    setSpecName('');
    setBaseUrl('');
    setSpecJson('');
    setSpecParameters([]);
    setSpecHasBaseUrl(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file selection for OpenAPI spec
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      try {
        let jsonContent: string;
        
        // Check if file is YAML
        if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
          // Parse YAML and convert to JSON
          const parsed = yaml.load(content);
          jsonContent = JSON.stringify(parsed, null, 2);
          toast.success(t('tools.apiSpec.yamlConverted'));
        } else {
          // Validate JSON and format it
          const parsed = JSON.parse(content);
          jsonContent = JSON.stringify(parsed, null, 2);
        }
        
        // Process the JSON content through handleSpecJsonChange
        handleSpecJsonChange(jsonContent);
        toast.success(t('tools.apiSpec.fileLoaded'));
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error(t('tools.apiSpec.fileParseError'));
      }
    };
    
    reader.onerror = () => {
      toast.error(t('tools.apiSpec.fileReadError'));
    };
    
    reader.readAsText(file);
  };

  const handleCreateApiSpec = async () => {
    if (!specName.trim() || !specJson.trim()) {
      toast.error(t('tools.apiSpec.fillRequired'));
      return;
    }

    // Base URL is required if not in spec
    if (!specHasBaseUrl && !baseUrl.trim()) {
      toast.error(t('tools.apiSpec.baseUrlRequired'));
      return;
    }

    // Validate parameters - all must have name and value
    const invalidParams = specParameters.some(p => !p.name.trim() || !p.value.trim());
    if (invalidParams) {
      toast.error(t('tools.mcp.fillAllParameters'));
      return;
    }

    // Check all required path parameters are filled
    const requiredNames = getRequiredParameterNames();
    const missingRequired = Array.from(requiredNames).filter(name => {
      const param = specParameters.find(p => p.name === name);
      return !param || !param.value.trim();
    });

    if (missingRequired.length > 0) {
      toast.error(t('tools.mcp.missingRequiredParams', { params: missingRequired.join(', ') }));
      return;
    }

    setCreating(true);
    try {
      let apiSpecObj;
      try {
        apiSpecObj = JSON.parse(specJson);
      } catch {
        toast.error(t('tools.apiSpec.invalidJson'));
        setCreating(false);
        return;
      }

      const request: APISpecCreateRequest = {
        name: specName.trim(),
        base_url: baseUrl.trim() || null,
        api_spec: apiSpecObj,
        parameters: specParameters.length > 0
          ? specParameters.map(p => ({
            uuid: '', // Will be generated by backend
            tool_parameter_type: p.tool_parameter_type,
            name: p.name.trim(),
            value: p.value.trim(),
          }))
          : undefined,
      };

      await toolsApi.createApiSpec(request);
      toast.success(t('tools.apiSpec.createSuccess'));
      setShowCreateModal(false);
      resetCreateModal();
      fetchApiSpecs();
    } catch (error: any) {
      console.error('Error creating API spec:', error);
      toast.error(error.response?.data?.detail || t('errors.generic'));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteApiSpec = (uuid: string, name: string) => {
    confirm({
      title: t('tools.apiSpec.confirmDelete'),
      message: t('tools.apiSpec.confirmDeleteMessage', { name }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await toolsApi.deleteApiSpec(uuid);
          toast.success(t('tools.apiSpec.deleteSuccess'));
          fetchApiSpecs();
        } catch (error: any) {
          console.error('Error deleting API spec:', error);
          toast.error(error.response?.data?.detail || t('errors.generic'));
        }
      },
    });
  };

  const toggleExpand = (uuid: string) => {
    setExpandedSpecs(prev => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      {/* Add API Spec Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          <PlusIcon className="h-4 w-4" />
          {t('tools.apiSpec.addSpec')}
        </button>
      </div>

      {/* API Specs List */}
      {apiSpecs.length > 0 ? (
        <div className="space-y-3">
          {apiSpecs.map(spec => {
            const isExpanded = expandedSpecs.has(spec.uuid);
            return (
              <div
                key={spec.uuid}
                className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
              >
                {/* Header - Clickable */}
                <button
                  onClick={() => toggleExpand(spec.uuid)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-x-3">
                    {isExpanded ? (
                      <ChevronDownIcon className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="text-left">
                      <h3 className="text-base font-semibold text-foreground">{spec.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {spec.tools.length} {spec.tools.length === 1 ? t('tools.tool') : t('tools.tools')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteApiSpec(spec.uuid, spec.name);
                    }}
                    className="rounded-md p-2 text-destructive hover:bg-destructive/10 transition-colors"
                    title={t('common.delete')}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 px-4 py-3">
                    {spec.tools.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-x-2">
                          <CommandLineIcon className="h-4 w-4 text-primary" />
                          {t('tools.mcp.availableTools')} ({spec.tools.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {spec.tools.map(tool => (
                            <ToolCard
                              key={tool.uuid}
                              name={tool.name}
                              description={tool.description}
                              toolKey={tool.key}
                              method={tool.method}
                              path={tool.path}
                              variant="viewable"
                              toolUuid={tool.uuid}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t('tools.apiSpec.noTools')}
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
          <h3 className="mt-4 text-lg font-semibold text-foreground">{t('tools.apiSpec.noSpecs')}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t('tools.apiSpec.noSpecsDescription')}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 inline-flex items-center gap-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            <PlusIcon className="h-4 w-4" />
            {t('tools.apiSpec.addSpec')}
          </button>
        </div>
      )}

      {/* Create API Spec Modal */}
      <Modal
        isOpen={showCreateModal}
        size="xl"
        onClose={() => {
          setShowCreateModal(false);
          resetCreateModal();
        }}
        title={t('tools.apiSpec.createTitle')}
        icon={DocumentTextIcon}
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
              onClick={handleCreateApiSpec}
              disabled={creating}
            >
              {creating ? t('common.creating') : t('common.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('tools.apiSpec.specName')}
            </label>
            <input
              type="text"
              value={specName}
              onChange={e => setSpecName(e.target.value)}
              className="block w-full rounded-lg border border-input-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={t('tools.apiSpec.specNamePlaceholder')}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-foreground">
                {t('tools.apiSpec.specJson')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.yaml,.yml"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="openapi-file-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-x-1 text-xs font-medium text-primary hover:text-primary-hover"
                >
                  <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                  {t('tools.apiSpec.uploadFile')}
                </button>
              </div>
            </div>
            <textarea
              value={specJson}
              onChange={e => handleSpecJsonChange(e.target.value)}
              rows={8}
              className="block w-full rounded-lg border border-input-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              placeholder='{"openapi": "3.0.0", "info": {...}, "paths": {...}}'
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t('tools.apiSpec.specJsonHelp')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {specHasBaseUrl ? t('tools.apiSpec.baseUrl') : t('tools.apiSpec.baseUrlRequired')}
              {!specHasBaseUrl && <span className="text-warning ml-1">*</span>}
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={e => handleBaseUrlChange(e.target.value)}
              className={`block w-full rounded-lg border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                !specHasBaseUrl && !baseUrl.trim() ? 'border-warning' : 'border-input-border'
              }`}
              placeholder="https://api.example.com"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {specHasBaseUrl 
                ? t('tools.apiSpec.baseUrlHelp')
                : t('tools.apiSpec.baseUrlRequiredHelp')
              }
            </p>
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

            {specParameters.length === 0 ? (
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
                {specParameters.map((param, index) => {
                  const isRequired = getRequiredParameterNames().has(param.name);
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
                            onChange={e =>
                              handleParameterChange(index, 'name', e.target.value)
                            }
                            disabled={isRequired}
                            className={`block w-full rounded-lg border border-input-border px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono ${
                              isRequired ? 'bg-muted cursor-not-allowed' : 'bg-input'
                            }`}
                            placeholder={t('tools.mcp.parameterNamePlaceholder')}
                          />
                        </div>

                        {/* Type Select */}
                        <div className="w-28 flex-shrink-0">
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            {t('tools.mcp.parameterType')}
                          </label>
                          <select
                            value={param.tool_parameter_type}
                            onChange={e =>
                              handleParameterChange(index, 'tool_parameter_type', e.target.value)
                            }
                            disabled={isRequired}
                            className={`block w-full rounded-lg border border-input-border px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                              isRequired ? 'bg-muted cursor-not-allowed' : 'bg-input'
                            }`}
                          >
                            {parameterTypeOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
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
                          {isRequired && <span className="text-warning ml-1">*</span>}
                        </label>
                        <input
                          type="text"
                          value={param.value}
                          onChange={e =>
                            handleParameterChange(index, 'value', e.target.value)
                          }
                          className={`block w-full rounded-lg border px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-input ${
                            isRequired && !param.value.trim()
                              ? 'border-warning'
                              : 'border-input-border'
                          }`}
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

export default APISpecsTab;
