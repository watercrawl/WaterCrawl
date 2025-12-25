import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { ChevronDownIcon, ChevronUpIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';

import { PARAMETER_TEMPLATES } from './types';

import type { ParameterDefinition, ParameterType, ParameterTemplateKey } from './types';

interface ParameterRowProps {
  parameter: ParameterDefinition;
  onChange: (parameter: ParameterDefinition) => void;
  onRemove: () => void;
  disabled?: boolean;
}

const ParameterRow: React.FC<ParameterRowProps> = ({
  parameter,
  onChange,
  onRemove,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (field: keyof ParameterDefinition, value: unknown) => {
    onChange({ ...parameter, [field]: value });
  };

  const handleTypeChange = (newType: ParameterType) => {
    // Reset type-specific fields when type changes
    const updated: ParameterDefinition = {
      ...parameter,
      type: newType,
      useTemplate: undefined,
      default: undefined,
      minimum: undefined,
      maximum: undefined,
      minLength: undefined,
      maxLength: undefined,
      enum: newType === 'enum' ? ['option1', 'option2'] : undefined,
      enumLabels: undefined,
    };
    onChange(updated);
  };

  const handleTemplateSelect = (templateKey: string) => {
    if (!templateKey) {
      // Clear template
      handleChange('useTemplate', undefined);
      return;
    }
    
    const template = PARAMETER_TEMPLATES.find(t => t.key === templateKey);
    if (template) {
      const updated: ParameterDefinition = {
        ...parameter,
        name: parameter.name || template.key,
        type: template.type,
        useTemplate: templateKey as ParameterTemplateKey,
        title: template.label,
        description: template.description,
        default: 'default' in template ? template.default : undefined,
        minimum: 'minimum' in template ? template.minimum : undefined,
        maximum: 'maximum' in template ? template.maximum : undefined,
        enum: 'enum' in template ? [...template.enum] : undefined,
      };
      onChange(updated);
    }
  };

  const isUsingTemplate = !!parameter.useTemplate;

  const handleEnumChange = (value: string) => {
    const enumValues = value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    handleChange('enum', enumValues.length > 0 ? enumValues : undefined);
  };

  const renderDefaultInput = () => {
    switch (parameter.type) {
      case 'boolean':
        return (
          <select
            value={parameter.default === true ? 'true' : parameter.default === false ? 'false' : ''}
            onChange={(e) => {
              const val = e.target.value;
              handleChange('default', val === '' ? undefined : val === 'true');
            }}
            disabled={disabled}
            className="block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          >
            <option value="">{t('schemaBuilder.noDefault')}</option>
            <option value="true">{t('common.true', 'True')}</option>
            <option value="false">{t('common.false', 'False')}</option>
          </select>
        );
      case 'number':
      case 'integer':
        return (
          <input
            type="number"
            value={parameter.default !== undefined ? String(parameter.default) : ''}
            onChange={(e) => {
              const val = e.target.value;
              handleChange('default', val === '' ? undefined : Number(val));
            }}
            step={parameter.type === 'integer' ? 1 : 'any'}
            disabled={disabled}
            placeholder={t('schemaBuilder.defaultValue')}
            className="block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
        );
      case 'enum':
        // For enum, show a select with the defined options
        return (
          <select
            value={parameter.default !== undefined ? String(parameter.default) : ''}
            onChange={(e) => handleChange('default', e.target.value || undefined)}
            disabled={disabled}
            className="block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          >
            <option value="">{t('schemaBuilder.noDefault')}</option>
            {parameter.enum?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={parameter.default !== undefined ? String(parameter.default) : ''}
            onChange={(e) => handleChange('default', e.target.value || undefined)}
            disabled={disabled}
            placeholder={t('schemaBuilder.defaultValue')}
            className="block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
        );
    }
  };

  return (
    <div className={`rounded-lg border bg-card ${isUsingTemplate ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
      {/* Template indicator */}
      {isUsingTemplate && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border-b border-primary/20 text-xs text-primary">
          <SparklesIcon className="h-3.5 w-3.5" />
          <span>{t('schemaBuilder.usingTemplate')}: <strong>{parameter.useTemplate}</strong></span>
        </div>
      )}
      
      {/* Main Row */}
      <div className="flex items-center gap-3 p-3">
        {/* Name */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={parameter.name}
            onChange={(e) => handleChange('name', e.target.value.replace(/\s/g, '_'))}
            disabled={disabled}
            placeholder={t('schemaBuilder.parameterName')}
            className="block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
        </div>

        {/* Template Selector */}
        <div className="w-36">
          <select
            value={parameter.useTemplate || ''}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            disabled={disabled}
            className="block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          >
            <option value="">{t('schemaBuilder.customParameter')}</option>
            <optgroup label={t('schemaBuilder.templates')}>
              {PARAMETER_TEMPLATES.map((tpl) => (
                <option key={tpl.key} value={tpl.key}>{tpl.label}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Type (disabled when using template) */}
        <div className="w-28">
          <select
            value={parameter.type}
            onChange={(e) => handleTypeChange(e.target.value as ParameterType)}
            disabled={disabled || isUsingTemplate}
            className="block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          >
            <option value="string">{t('schemaBuilder.types.string')}</option>
            <option value="number">{t('schemaBuilder.types.number')}</option>
            <option value="integer">{t('schemaBuilder.types.integer')}</option>
            <option value="boolean">{t('schemaBuilder.types.boolean')}</option>
            <option value="enum">{t('schemaBuilder.types.enum')}</option>
          </select>
        </div>

        {/* Required Toggle */}
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={parameter.required || false}
            onChange={(e) => handleChange('required', e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
          />
          <span className="whitespace-nowrap">{t('schemaBuilder.required')}</span>
        </label>

        {/* Expand/Collapse */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
        >
          {isExpanded ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </button>

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors disabled:opacity-50"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Expanded Section */}
      {isExpanded && (
        <div className="border-t border-border p-3 space-y-3 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t('schemaBuilder.title')}
              </label>
              <input
                type="text"
                value={parameter.title || ''}
                onChange={(e) => handleChange('title', e.target.value || undefined)}
                disabled={disabled}
                placeholder={t('schemaBuilder.titlePlaceholder')}
                className="block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>

            {/* Default Value */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t('schemaBuilder.defaultValue')}
              </label>
              {renderDefaultInput()}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('schemaBuilder.description')}
            </label>
            <textarea
              value={parameter.description || ''}
              onChange={(e) => handleChange('description', e.target.value || undefined)}
              disabled={disabled}
              placeholder={t('schemaBuilder.descriptionPlaceholder')}
              rows={2}
              className="block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 resize-none"
            />
          </div>

          {/* Type-specific constraints */}
          {(parameter.type === 'number' || parameter.type === 'integer') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {t('schemaBuilder.minimum')}
                </label>
                <input
                  type="number"
                  value={parameter.minimum !== undefined ? parameter.minimum : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleChange('minimum', val === '' ? undefined : Number(val));
                  }}
                  step={parameter.type === 'integer' ? 1 : 'any'}
                  disabled={disabled}
                  placeholder="0"
                  className="block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {t('schemaBuilder.maximum')}
                </label>
                <input
                  type="number"
                  value={parameter.maximum !== undefined ? parameter.maximum : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleChange('maximum', val === '' ? undefined : Number(val));
                  }}
                  step={parameter.type === 'integer' ? 1 : 'any'}
                  disabled={disabled}
                  placeholder="100"
                  className="block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {parameter.type === 'string' && !isUsingTemplate && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {t('schemaBuilder.minLength')}
                </label>
                <input
                  type="number"
                  value={parameter.minLength !== undefined ? parameter.minLength : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleChange('minLength', val === '' ? undefined : Number(val));
                  }}
                  min={0}
                  step={1}
                  disabled={disabled}
                  placeholder="0"
                  className="block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {t('schemaBuilder.maxLength')}
                </label>
                <input
                  type="number"
                  value={parameter.maxLength !== undefined ? parameter.maxLength : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleChange('maxLength', val === '' ? undefined : Number(val));
                  }}
                  min={0}
                  step={1}
                  disabled={disabled}
                  placeholder="255"
                  className="block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* Enum Options - for enum type or string with options */}
          {(parameter.type === 'enum' || (parameter.type === 'string' && !isUsingTemplate)) && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {parameter.type === 'enum' ? t('schemaBuilder.enumOptionsRequired') : t('schemaBuilder.enumOptions')}
              </label>
              <input
                type="text"
                value={parameter.enum?.join(', ') || ''}
                onChange={(e) => handleEnumChange(e.target.value)}
                disabled={disabled}
                placeholder={t('schemaBuilder.enumPlaceholder')}
                className="block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {parameter.type === 'enum' ? t('schemaBuilder.enumRequiredHint') : t('schemaBuilder.enumHint')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParameterRow;
