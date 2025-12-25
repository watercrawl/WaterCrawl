import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { PlusIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

import ParameterRow from './ParameterRow';
import { parametersToJsonSchema } from './types';

import type { ParameterDefinition, ParameterSchemaBuilderProps } from './types';

const ParameterSchemaBuilder: React.FC<ParameterSchemaBuilderProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [showPreview, setShowPreview] = useState(false);

  const handleAddParameter = () => {
    const newParam: ParameterDefinition = {
      id: `param-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      type: 'string',
      required: false,
    };
    onChange([...value, newParam]);
  };

  const handleUpdateParameter = (index: number, parameter: ParameterDefinition) => {
    const updated = [...value];
    updated[index] = parameter;
    onChange(updated);
  };

  const handleRemoveParameter = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const generatedSchema = parametersToJsonSchema(value);
  const hasParameters = value.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">
          {t('schemaBuilder.parameters')}
        </h4>
        <div className="flex items-center gap-2">
          {hasParameters && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPreview ? (
                <>
                  <EyeSlashIcon className="h-4 w-4" />
                  {t('schemaBuilder.hidePreview')}
                </>
              ) : (
                <>
                  <EyeIcon className="h-4 w-4" />
                  {t('schemaBuilder.showPreview')}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Parameters List */}
      {hasParameters ? (
        <div className="space-y-2">
          {value.map((param, index) => (
            <ParameterRow
              key={param.id}
              parameter={param}
              onChange={(updated) => handleUpdateParameter(index, updated)}
              onRemove={() => handleRemoveParameter(index)}
              disabled={disabled}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t('schemaBuilder.noParameters')}
          </p>
        </div>
      )}

      {/* Add Parameter Button */}
      <button
        type="button"
        onClick={handleAddParameter}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <PlusIcon className="h-4 w-4" />
        {t('schemaBuilder.addParameter')}
      </button>

      {/* Schema Preview */}
      {showPreview && hasParameters && (
        <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
          <div className="px-3 py-2 bg-muted/50 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">
              {t('schemaBuilder.generatedSchema')}
            </span>
          </div>
          <pre className="p-3 text-xs text-foreground overflow-auto max-h-60">
            {JSON.stringify(generatedSchema, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ParameterSchemaBuilder;
