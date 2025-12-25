import React, { useCallback, useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

import MarkdownRenderer from '../shared/MarkdownRenderer';
import Modal from '../shared/Modal';

import type { AgentAsTool, ToolParameterStrategy, ToolParameterStrategyConfig, ToolParametersConfig } from '../../types/agent';
import type { JSONSchemaDefinition } from '../json-forms/types/schema';

interface AgentToolConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentTool: AgentAsTool;
  onSave: (config: ToolParametersConfig) => Promise<void>;
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
  isComplex?: boolean;
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

// Single parameter row component
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
      <div className="flex items-center gap-2 py-1.5 group">
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
export const AgentToolConfigModal: React.FC<AgentToolConfigModalProps> = ({
  isOpen,
  onClose,
  agentTool,
  onSave,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ConfigTab>('parameters');
  const [saving, setSaving] = useState(false);
  
  // Parse existing config or initialize with defaults
  const existingConfig = agentTool.config as ToolParametersConfig | undefined;
  
  const initialParamsConfig = useMemo((): Record<string, ToolParameterStrategyConfig> => {
    if (existingConfig?.parameters?.properties) {
      return existingConfig.parameters.properties;
    }
    
    // Initialize all parameters with 'llm' strategy by default
    const inputSchema = agentTool.input_schema as JSONSchemaDefinition | undefined;
    if (!inputSchema?.properties) return {};
    
    const defaultConfig: Record<string, ToolParameterStrategyConfig> = {};
    Object.keys(inputSchema.properties).forEach((propName) => {
      defaultConfig[propName] = { strategy: 'llm' };
    });
    return defaultConfig;
  }, [agentTool, existingConfig]);

  const [paramsConfig, setParamsConfig] = useState<Record<string, ToolParameterStrategyConfig>>(initialParamsConfig);
  const [functionName, setFunctionName] = useState<string>(existingConfig?.function_name || '');
  const [description, setDescription] = useState<string>(existingConfig?.description || '');

  const inputSchema = agentTool.input_schema as JSONSchemaDefinition | undefined;
  const properties = inputSchema?.properties || {};
  const requiredFields = inputSchema?.required || [];
  const hasParameters = inputSchema?.properties && Object.keys(inputSchema.properties).length > 0;

  const handleParameterChange = useCallback((name: string, paramConfig: ToolParameterStrategyConfig) => {
    setParamsConfig((prev) => ({
      ...prev,
      [name]: paramConfig,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const result: ToolParametersConfig = {
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
      
      await onSave(result);
      onClose();
    } finally {
      setSaving(false);
    }
  }, [paramsConfig, functionName, description, onSave, onClose]);

  const tabs = [
    { id: 'parameters' as ConfigTab, label: t('agents.toolConfig.tabs.parameters'), icon: '⚙️' },
    { id: 'function' as ConfigTab, label: t('agents.toolConfig.tabs.function'), icon: '📝' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('agents.agentToolConfig.title')}: ${agentTool.name}`}
      size="2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-input-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? t('common.saving') : t('common.save')}
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
                placeholder={agentTool.key}
                className="w-full rounded-md border border-input-border bg-background px-3 py-2 pe-24 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setFunctionName(agentTool.key)}
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
                onClick={() => setDescription(agentTool.description || '')}
                className="rounded px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary-soft transition-colors"
              >
                {t('agents.toolConfig.fillOriginal')}
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={agentTool.description}
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
                  {functionName.trim() || agentTool.key}
                </code>
              </div>
              <div className="flex items-start gap-2 flex-col">
                <div className="text-xs text-muted-foreground flex-shrink-0">{t('agents.toolConfig.descriptionLabel')}:</div>
                <div className="flex-1 border-border bg-muted p-2 rounded w-full overflow-hidden">
                  <MarkdownRenderer
                    content={description.trim() || agentTool.description || t('agents.toolConfig.noDescription')}
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

export default AgentToolConfigModal;
