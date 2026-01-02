import React, { useState, useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import {
  ChevronDownIcon,
  ChevronRightIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

import SectionHeader from '../SectionHeader';
import { Switch } from '../../shared/Switch';

interface AgentFormJsonOutputSectionProps {
  jsonOutput: boolean;
  jsonSchema: Record<string, unknown> | null;
  onJsonOutputChange: (enabled: boolean) => void;
  onJsonSchemaChange: (schema: Record<string, unknown> | null) => void;
}

/**
 * Three-state structured output configuration:
 * 1. Disabled (jsonOutput=false): Normal chat without structured output
 * 2. Dynamic Schema (jsonOutput=true, jsonSchema=null): API callers must provide output_schema
 * 3. Predefined Schema (jsonOutput=true, jsonSchema set): Uses the schema defined here
 */
const AgentFormJsonOutputSection: React.FC<AgentFormJsonOutputSectionProps> = ({
  jsonOutput,
  jsonSchema,
  onJsonOutputChange,
  onJsonSchemaChange,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(jsonOutput);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [schemaText, setSchemaText] = useState<string>(
    jsonSchema ? JSON.stringify(jsonSchema, null, 2) : ''
  );

  // Determine current mode
  const currentMode: 'disabled' | 'dynamic' | 'predefined' = useMemo(() => {
    if (!jsonOutput) return 'disabled';
    if (!jsonSchema) return 'dynamic';
    return 'predefined';
  }, [jsonOutput, jsonSchema]);

  const handleToggle = useCallback(() => {
    const newValue = !jsonOutput;
    onJsonOutputChange(newValue);
    if (newValue) {
      setIsExpanded(true);
    }
  }, [jsonOutput, onJsonOutputChange]);

  const handleSchemaChange = useCallback((text: string) => {
    setSchemaText(text);
    setSchemaError(null);

    if (!text.trim()) {
      onJsonSchemaChange(null);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object' && parsed !== null) {
        onJsonSchemaChange(parsed);
      } else {
        setSchemaError(t('agents.jsonOutput.invalidSchema'));
      }
    } catch {
      setSchemaError(t('agents.jsonOutput.invalidJson'));
    }
  }, [onJsonSchemaChange, t]);

  const exampleSchema = useMemo(() => ({
    title: 'AgentResponse',
    description: 'Structured response from the agent',
    type: 'object',
    properties: {
      answer: { type: 'string', description: 'The answer to the question' },
      confidence: { type: 'number', description: 'Confidence score 0-1' },
      sources: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of sources',
      },
    },
    required: ['answer'],
  }), []);

  const handleInsertExample = useCallback(() => {
    const exampleText = JSON.stringify(exampleSchema, null, 2);
    setSchemaText(exampleText);
    setSchemaError(null);
    onJsonSchemaChange(exampleSchema);
  }, [exampleSchema, onJsonSchemaChange]);

  const handleClearSchema = useCallback(() => {
    setSchemaText('');
    setSchemaError(null);
    onJsonSchemaChange(null);
  }, [onJsonSchemaChange]);

  return (
    <div>
      <SectionHeader title={t('agents.jsonOutput.title')} />

      {/* Toggle */}
      <div className="rounded-md border border-input-border bg-card p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0.5 rounded hover:bg-muted"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <div className="flex-1">
              <Switch
                label={t('agents.jsonOutput.enableLabel')}
                description={t('agents.jsonOutput.enableDescription')}
                checked={jsonOutput}
                onChange={handleToggle}
              />
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border">
            {/* Current Mode Status */}
            <div className="mb-4 p-3 rounded-md bg-muted/50">
              <div className="flex items-start gap-2">
                <InformationCircleIcon className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-foreground mb-1">
                    {t('agents.jsonOutput.currentMode')}:{' '}
                    <span className={`${
                      currentMode === 'disabled' ? 'text-muted-foreground' :
                      currentMode === 'dynamic' ? 'text-warning' : 'text-success'
                    }`}>
                      {t(`agents.jsonOutput.mode.${currentMode}`)}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    {t(`agents.jsonOutput.modeDescription.${currentMode}`)}
                  </p>
                </div>
              </div>
            </div>

            {/* Schema Editor - Only show when json_output is enabled */}
            {jsonOutput && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">
                    {t('agents.jsonOutput.schemaLabel')}
                    <span className="ml-1 text-xs text-muted-foreground font-normal">
                      ({t('agents.jsonOutput.schemaOptional')})
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    {schemaText && (
                      <button
                        type="button"
                        onClick={handleClearSchema}
                        className="text-xs text-muted-foreground hover:text-danger"
                      >
                        {t('agents.jsonOutput.clearSchema')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleInsertExample}
                      className="text-xs text-primary hover:text-primary-hover"
                    >
                      {t('agents.jsonOutput.insertExample')}
                    </button>
                  </div>
                </div>
                <textarea
                  value={schemaText}
                  onChange={(e) => handleSchemaChange(e.target.value)}
                  placeholder={t('agents.jsonOutput.schemaPlaceholder')}
                  rows={10}
                  className={`w-full rounded-md border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 resize-y ${
                    schemaError
                      ? 'border-danger focus:border-danger focus:ring-danger'
                      : 'border-input-border focus:border-primary focus:ring-primary'
                  }`}
                />
                {schemaError && (
                  <p className="mt-1 text-xs text-danger">{schemaError}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('agents.jsonOutput.schemaHint')}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentFormJsonOutputSection;
