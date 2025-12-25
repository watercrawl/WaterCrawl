import React, { useCallback, useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { Cog6ToothIcon } from '@heroicons/react/24/outline';

import { JsonSchemaForm } from '../json-forms/JsonSchemaForm';

import Modal from './Modal';

import type { Model, ProviderEmbedding } from '../../types/provider';
import type { JSONSchemaDefinition } from '../json-forms/types/schema';

interface LLMConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: Model | ProviderEmbedding | null;
  value: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  title?: string;
}

/**
 * A reusable modal for configuring LLM parameters using JsonSchemaForm.
 * The form fields are dynamically generated from the model's parameters_schema.
 */
export const LLMConfigModal: React.FC<LLMConfigModalProps> = ({
  isOpen,
  onClose,
  model,
  value,
  onChange,
  title,
}) => {
  const { t } = useTranslation();
  const [localConfig, setLocalConfig] = useState<Record<string, unknown>>(value || {});

  // Sync local state with external value when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalConfig(value || {});
    }
  }, [isOpen, value]);

  // Get the parameters schema from the model
  const parametersSchema: JSONSchemaDefinition | null = model?.parameters_schema || null;

  // Handle config changes
  const handleConfigChange = useCallback((newConfig: Record<string, unknown>) => {
    setLocalConfig(newConfig);
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    onChange(localConfig);
    onClose();
  }, [localConfig, onChange, onClose]);

  if (!model) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || t('common.llmConfig.title')}
      icon={Cog6ToothIcon}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            {t('common.save')}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Model Info */}
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{model.label}</span>
            <span className="text-xs text-muted-foreground">({model.key})</span>
          </div>
          {model.model_properties?.context_size && (
            <div className="mt-1 text-xs text-muted-foreground">
              {t('common.llmConfig.contextSize')}: {model.model_properties.context_size.toLocaleString()} tokens
            </div>
          )}
        </div>

        {/* Dynamic Form */}
        {parametersSchema ? (
          <JsonSchemaForm
            schema={parametersSchema}
            value={localConfig}
            onChange={handleConfigChange}
          />
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t('common.llmConfig.noParameters')}
          </div>
        )}
      </div>
    </Modal>
  );
};

/**
 * A button that opens the LLM Config Modal.
 * Can be used inline in forms to trigger config editing.
 */
interface LLMConfigButtonProps {
  model: Model | ProviderEmbedding | null;
  value: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  disabled?: boolean;
  label?: string;
  modalTitle?: string;
  /** Compact mode shows only icon with tooltip */
  compact?: boolean;
}

export const LLMConfigButton: React.FC<LLMConfigButtonProps> = ({
  model,
  value,
  onChange,
  disabled = false,
  label,
  modalTitle,
  compact = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Count configured parameters
  const configCount = Object.keys(value || {}).filter(
    key => value[key] !== undefined && value[key] !== null
  ).length;

  const buttonLabel = label || t('common.llmConfig.configure');

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={disabled || !model}
          className="relative inline-flex items-center justify-center rounded-md border border-input-border bg-background p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          title={buttonLabel}
        >
          <Cog6ToothIcon className="h-4 w-4" />
          {configCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {configCount}
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={disabled || !model}
          className="inline-flex items-center gap-2 rounded-md border border-input-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Cog6ToothIcon className="h-4 w-4" />
          <span>{buttonLabel}</span>
          {configCount > 0 && (
            <span className="ml-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary">
              {configCount}
            </span>
          )}
        </button>
      )}

      <LLMConfigModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        model={model}
        value={value}
        onChange={onChange}
        title={modalTitle}
      />
    </>
  );
};

export default LLMConfigModal;
