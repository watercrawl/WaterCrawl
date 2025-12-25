import React, { useCallback, useEffect, useMemo, useState } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

import MarkdownRenderer from '../shared/MarkdownRenderer';
import Modal from '../shared/Modal';

import { knowledgeBaseApi } from '../../services/api/knowledgeBase';

import type { AgentKnowledgeBase, ToolParameterStrategy, ToolParameterStrategyConfig, ToolParametersConfig } from '../../types/agent';
import type { RetrievalSetting } from '../../types/knowledge';
import type { JSONSchemaDefinition } from '../json-forms/types/schema';

interface KnowledgeBaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeBase: AgentKnowledgeBase;
  onSave: (config: ToolParametersConfig) => void;
}

// Strategy button styles
const STRATEGY_STYLES: Record<ToolParameterStrategy, { active: string; inactive: string; icon: string }> = {
  llm: {
    active: 'bg-primary text-primary-foreground',
    inactive: 'bg-transparent text-primary hover:bg-primary-soft',
    icon: '🤖',
  },
  fixed: {
    active: 'bg-warning text-warning-foreground',
    inactive: 'bg-transparent text-warning hover:bg-warning-soft',
    icon: '📌',
  },
  exclude: {
    active: 'bg-muted text-muted-foreground',
    inactive: 'bg-transparent text-muted-foreground hover:bg-muted',
    icon: '⊘',
  },
  keep: {
    active: 'bg-success text-success-foreground',
    inactive: 'bg-transparent text-success hover:bg-success-soft',
    icon: '📁',
  },
};

// Get default value for a schema type
const getDefaultValue = (schema: JSONSchemaDefinition): unknown => {
  if (schema.default !== undefined) return schema.default;
  if (schema.enum && schema.enum.length > 0) return schema.enum[0];
  
  switch (schema.type) {
    case 'string':
      return '';
    case 'number':
    case 'integer':
      return schema.minimum ?? 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return '';
  }
};

// Compact value input based on schema type
interface ValueInputProps {
  schema: JSONSchemaDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  isComplex?: boolean; // For array/object types that need JSON editor
}

const ValueInput: React.FC<ValueInputProps> = ({ schema, value, onChange, isComplex = false }) => {
  const { t } = useTranslation();
  const inputClasses = 'w-full rounded border border-input-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

  if (schema.enum) {
    return (
      <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={inputClasses}>
        {schema.enum.map((option, index) => (
          <option key={index} value={String(option)}>
            {schema.enumNames?.[index] ?? String(option)}
          </option>
        ))}
      </select>
    );
  }

  switch (schema.type) {
    case 'boolean':
      return (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            value ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          {value ? 'true' : 'false'}
        </button>
      );

    case 'number':
    case 'integer':
      return (
        <input
          type="number"
          value={value as number ?? ''}
          onChange={(e) => onChange(schema.type === 'integer' ? parseInt(e.target.value, 10) : parseFloat(e.target.value))}
          min={schema.minimum}
          max={schema.maximum}
          step={schema.type === 'integer' ? 1 : schema.multipleOf ? Number(schema.multipleOf) : 'any'}
          placeholder={schema.placeholder ?? t('agents.toolConfig.enterValue')}
          className={inputClasses}
        />
      );

    case 'array':
    case 'object':
      // Use JSON editor (textarea) for complex types
      return (
        <textarea
          value={typeof value === 'string' ? value : JSON.stringify(value ?? (schema.type === 'array' ? [] : {}), null, 2)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              onChange(e.target.value);
            }
          }}
          placeholder={schema.type === 'array' ? '[\n  "item1",\n  "item2"\n]' : '{\n  "key": "value"\n}'}
          rows={isComplex ? 6 : 4}
          className={`${inputClasses} font-mono resize-y min-h-[80px]`}
        />
      );

    default:
      return (
        <input
          type={schema.format === 'email' ? 'email' : schema.format === 'uri' || schema.format === 'url' ? 'url' : 'text'}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={schema.placeholder ?? t('agents.toolConfig.enterValue')}
          maxLength={schema.maxLength}
          className={inputClasses}
        />
      );
  }
};

// Strategy button component
interface StrategyButtonProps {
  strategy: ToolParameterStrategy;
  isActive: boolean;
  onClick: () => void;
  showKeep?: boolean;
}

const StrategyButton: React.FC<StrategyButtonProps> = ({ strategy, isActive, onClick, showKeep = false }) => {
  const { t } = useTranslation();
  if (strategy === 'keep' && !showKeep) return null;
  
  const style = STRATEGY_STYLES[strategy];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all border ${
        isActive ? `${style.active} border-transparent` : `${style.inactive} border-border`
      }`}
      title={t(`agents.toolConfig.strategy.${strategy}Description`)}
    >
      <span className="me-0.5">{style.icon}</span>
      {t(`agents.toolConfig.strategy.${strategy}`)}
    </button>
  );
};

// Single parameter row component - compact design
interface ParameterRowProps {
  name: string;
  schema: JSONSchemaDefinition;
  config: ToolParameterStrategyConfig;
  onChange: (config: ToolParameterStrategyConfig) => void;
  depth?: number;
  isRequired?: boolean;
}

const ParameterRow: React.FC<ParameterRowProps> = ({
  name,
  schema,
  config,
  onChange,
  depth = 0,
  isRequired = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(config.strategy === 'keep');

  const hasNestedProperties = schema.type === 'object' && schema.properties && Object.keys(schema.properties).length > 0;

  const handleStrategyChange = useCallback((strategy: ToolParameterStrategy) => {
    if (strategy === 'fixed') {
      onChange({ strategy, value: getDefaultValue(schema) });
    } else if (strategy === 'keep' && hasNestedProperties) {
      const nestedProperties: Record<string, ToolParameterStrategyConfig> = {};
      Object.keys(schema.properties || {}).forEach((propName) => {
        nestedProperties[propName] = { strategy: 'llm' };
      });
      onChange({ strategy, properties: nestedProperties });
      setIsExpanded(true);
    } else {
      onChange({ strategy });
    }
  }, [onChange, schema, hasNestedProperties]);

  const handleValueChange = useCallback((value: unknown) => {
    onChange({ ...config, value });
  }, [config, onChange]);

  const handleNestedChange = useCallback((propName: string, propConfig: ToolParameterStrategyConfig) => {
    onChange({
      ...config,
      properties: { ...config.properties, [propName]: propConfig },
    });
  }, [config, onChange]);

  const strategies: ToolParameterStrategy[] = ['llm', 'fixed', 'exclude', 'keep'];

  return (
    <div className={`${depth > 0 ? 'ms-4 border-s-2 border-border ps-2' : ''}`}>
      {/* Compact row */}
      <div className="flex items-center gap-2 py-1.5 group">
        {/* Expand button for nested */}
        {hasNestedProperties && config.strategy === 'keep' ? (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 rounded hover:bg-muted flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-4 flex-shrink-0" />
        )}

        {/* Parameter name and type */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <code className="text-xs font-medium text-foreground truncate">{name}</code>
          {isRequired && <span className="text-[10px] text-error">*</span>}
          <span className="text-[10px] text-muted-foreground">({schema.type})</span>
          {schema.description && (
            <span
              className="text-[10px] text-muted-foreground/70 truncate max-w-[150px] hidden group-hover:inline"
              title={schema.description}
            >
              — {schema.description}
            </span>
          )}
        </div>

        {/* Strategy buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {strategies.map((s) => (
            <StrategyButton
              key={s}
              strategy={s}
              isActive={config.strategy === s}
              onClick={() => handleStrategyChange(s)}
              showKeep={hasNestedProperties}
            />
          ))}
        </div>
      </div>

      {/* Fixed value input - below the row */}
      {config.strategy === 'fixed' && (
        <div className="ms-6 mt-1 mb-2">
          <ValueInput
            schema={schema}
            value={config.value}
            onChange={handleValueChange}
            isComplex={schema.type === 'array' || schema.type === 'object'}
          />
        </div>
      )}

      {/* Nested properties */}
      {config.strategy === 'keep' && hasNestedProperties && isExpanded && (
        <div className="mt-1 space-y-0.5">
          {Object.entries(schema.properties || {}).map(([propName, propSchema]) => (
            <ParameterRow
              key={propName}
              name={propName}
              schema={propSchema}
              config={config.properties?.[propName] || { strategy: 'llm' }}
              onChange={(propConfig) => handleNestedChange(propName, propConfig)}
              depth={depth + 1}
              isRequired={schema.required?.includes(propName)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Tab type
type ConfigTab = 'parameters' | 'function';

// Main modal component
export const KnowledgeBaseConfigModal: React.FC<KnowledgeBaseConfigModalProps> = ({
  isOpen,
  onClose,
  knowledgeBase,
  onSave,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ConfigTab>('parameters');
  const [retrievalSettings, setRetrievalSettings] = useState<RetrievalSetting[]>([]);
  const [isLoadingRetrievalSettings, setIsLoadingRetrievalSettings] = useState(false);
  const [defaultRetrievalSetting, setDefaultRetrievalSetting] = useState<RetrievalSetting | null>(null);
  
  // Parse existing config or initialize with defaults
  const existingConfig = knowledgeBase.config as ToolParametersConfig | undefined;
  
  // Get current retrieval setting UUID from config
  const currentRetrievalSettingUuid = useMemo(() => {
    if (knowledgeBase.config && typeof knowledgeBase.config === 'object' && 'retrieval_setting_uuid' in knowledgeBase.config) {
      return knowledgeBase.config.retrieval_setting_uuid as string;
    }
    return null;
  }, [knowledgeBase.config]);
  
  const [selectedRetrievalSettingUuid, setSelectedRetrievalSettingUuid] = useState<string | null>(currentRetrievalSettingUuid);
  
  // Fetch retrieval settings when modal opens
  useEffect(() => {
    if (isOpen && knowledgeBase.knowledge_base_uuid) {
      const fetchRetrievalSettings = async () => {
        setIsLoadingRetrievalSettings(true);
        try {
          // First, get the knowledge base to get default retrieval setting
          const kb = await knowledgeBaseApi.get(knowledgeBase.knowledge_base_uuid);
          if (kb.default_retrieval_setting) {
            setDefaultRetrievalSetting(kb.default_retrieval_setting);
          }
          
          // Then fetch all retrieval settings
          const response = await knowledgeBaseApi.listRetrievalSettings(knowledgeBase.knowledge_base_uuid);
          const settings: RetrievalSetting[] = Array.isArray(response) 
            ? response 
            : (response.results || []);
          setRetrievalSettings(settings);
          
          // If no retrieval setting is selected, use default
          if (!currentRetrievalSettingUuid && kb.default_retrieval_setting) {
            setSelectedRetrievalSettingUuid(kb.default_retrieval_setting.uuid);
          }
        } catch (error) {
          console.error('Failed to fetch retrieval settings:', error);
          toast.error(t('settings.knowledgeBase.retrievalSettings.loadError'));
        } finally {
          setIsLoadingRetrievalSettings(false);
        }
      };
      
      fetchRetrievalSettings();
    }
  }, [isOpen, knowledgeBase.knowledge_base_uuid, currentRetrievalSettingUuid, t]);
  
  const initialParamsConfig = useMemo((): Record<string, ToolParameterStrategyConfig> => {
    if (existingConfig?.parameters?.properties) {
      return existingConfig.parameters.properties;
    }
    
    // Initialize all parameters with 'llm' strategy by default
    const inputSchema = knowledgeBase.input_schema as JSONSchemaDefinition | undefined;
    if (!inputSchema?.properties) return {};
    
    const defaultConfig: Record<string, ToolParameterStrategyConfig> = {};
    Object.keys(inputSchema.properties).forEach((propName) => {
      defaultConfig[propName] = { strategy: 'llm' };
    });
    return defaultConfig;
  }, [knowledgeBase, existingConfig]);

  const [paramsConfig, setParamsConfig] = useState<Record<string, ToolParameterStrategyConfig>>(initialParamsConfig);
  const [functionName, setFunctionName] = useState<string>(existingConfig?.function_name || '');
  const [description, setDescription] = useState<string>(existingConfig?.description || '');

  const inputSchema = knowledgeBase.input_schema as JSONSchemaDefinition | undefined;
  const properties = inputSchema?.properties || {};
  const requiredFields = inputSchema?.required || [];
  const hasParameters = inputSchema?.properties && Object.keys(inputSchema.properties).length > 0;

  const handleParameterChange = useCallback((name: string, paramConfig: ToolParameterStrategyConfig) => {
    setParamsConfig((prev) => ({
      ...prev,
      [name]: paramConfig,
    }));
  }, []);

  const handleSave = useCallback(() => {
    const result: ToolParametersConfig & { retrieval_setting_uuid?: string } = {
      parameters: {
        type: 'object',
        properties: paramsConfig,
      },
    };
    
    // Only include function_name and description if they have values
    if (functionName.trim()) {
      result.function_name = functionName.trim();
    }
    if (description.trim()) {
      result.description = description.trim();
    }
    
    // Include selected retrieval setting UUID
    if (selectedRetrievalSettingUuid) {
      result.retrieval_setting_uuid = selectedRetrievalSettingUuid;
    }
    
    onSave(result as ToolParametersConfig);
    onClose();
  }, [paramsConfig, functionName, description, selectedRetrievalSettingUuid, onSave, onClose]);

  const tabs = [
    { id: 'parameters' as ConfigTab, label: t('agents.toolConfig.tabs.parameters'), icon: '⚙️' },
    { id: 'function' as ConfigTab, label: t('agents.toolConfig.tabs.function'), icon: '📝' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={knowledgeBase.title}
      size="2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            {t('common.save')}
          </button>
        </>
      }
    >
      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
            }`}
          >
            <span className="me-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Parameters Tab */}
      {activeTab === 'parameters' && (
        <>
          {hasParameters ? (
            <>
              {/* Column headers */}
              <div className="flex items-center gap-2 py-1 px-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border mb-1">
                <div className="w-4" />
                <div className="flex-1">{t('agents.toolConfig.parameter')}</div>
                <div className="flex-shrink-0 text-center">{t('agents.toolConfig.strategyLabel')}</div>
              </div>

              {/* Parameters list */}
              <div className="max-h-[50vh] overflow-y-auto divide-y divide-border/50">
                {Object.entries(properties).map(([name, schema]) => (
                  <ParameterRow
                    key={name}
                    name={name}
                    schema={schema}
                    config={paramsConfig[name] || { strategy: 'llm' }}
                    onChange={(paramConfig) => handleParameterChange(name, paramConfig)}
                    isRequired={requiredFields.includes(name)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('agents.toolConfig.noParameters')}
            </div>
          )}
        </>
      )}

      {/* Function Settings Tab */}
      {activeTab === 'function' && (
        <div className="space-y-4">
          {/* Retrieval Setting Selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('settings.knowledgeBase.query.retrievalSetting')}
            </label>
            {isLoadingRetrievalSettings ? (
              <div className="text-sm text-muted-foreground">
                {t('common.loading')}...
              </div>
            ) : (
              <>
                <select
                  value={selectedRetrievalSettingUuid || ''}
                  onChange={(e) => setSelectedRetrievalSettingUuid(e.target.value || null)}
                  className="w-full rounded-md border border-input-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {defaultRetrievalSetting && (
                    <option value={defaultRetrievalSetting.uuid}>
                      {defaultRetrievalSetting.name} ({t('common.default')})
                    </option>
                  )}
                  {retrievalSettings
                    .filter(s => s.uuid !== defaultRetrievalSetting?.uuid)
                    .map((setting) => (
                      <option key={setting.uuid} value={setting.uuid}>
                        {setting.name}
                      </option>
                    ))}
                </select>
                {retrievalSettings.length === 0 && !isLoadingRetrievalSettings && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('agents.form.noRetrievalSettings')}
                  </p>
                )}
              </>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {t('agents.kbConfig.retrievalSettingHint')}
            </p>
          </div>

          {/* Function Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('agents.toolConfig.functionName')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
                placeholder={knowledgeBase.key}
                className="w-full rounded-md border border-input-border bg-background px-3 py-2 pe-24 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setFunctionName(knowledgeBase.key)}
                className="absolute end-1 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary-soft transition-colors"
              >
                {t('agents.toolConfig.fillOriginal')}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('agents.toolConfig.functionNameHint')}
            </p>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-foreground">
                {t('agents.toolConfig.descriptionLabel')}
              </label>
              <button
                type="button"
                onClick={() => setDescription(knowledgeBase.description || '')}
                className="rounded px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary-soft transition-colors"
              >
                {t('agents.toolConfig.fillOriginal')}
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={knowledgeBase.description}
              rows={4}
              className="w-full rounded-md border border-input-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t('agents.toolConfig.descriptionHint')}
            </p>
          </div>

          {/* Preview */}
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {t('agents.toolConfig.preview')}
            </h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t('agents.toolConfig.functionName')}:</span>
                <code className="text-xs font-medium text-foreground">
                  {functionName.trim() || knowledgeBase.key}
                </code>
              </div>
              <div className="flex items-start gap-2 flex-col">
                <div className="text-xs text-muted-foreground flex-shrink-0">{t('agents.toolConfig.descriptionLabel')}:</div>
                <div className="flex-1 border-border bg-muted p-2 rounded w-full overflow-hidden">
                  <MarkdownRenderer
                    content={description.trim() || knowledgeBase.description || t('agents.toolConfig.noDescription')}
                    className="text-sm text-muted-foreground prose-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default KnowledgeBaseConfigModal;
