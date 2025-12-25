import React, { useState, useEffect, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import {
  BeakerIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

import { JsonSchemaForm } from '../json-forms/JsonSchemaForm';

import { toolsApi } from '../../services/api/tools';

import Loading from './Loading';
import Modal from './Modal';


import type { ToolListItem, TestToolResponse } from '../../types/tools';
import type { JSONSchemaDefinition } from '../json-forms/types/schema';

interface ToolTestModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Tool UUID - will fetch tool details */
  toolUuid?: string;
  /** Tool object - if provided, won't fetch */
  tool?: ToolListItem;
}

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * A modal for testing any tool (MCP, API Spec, or Built-in).
 * Renders a form based on the tool's input_schema and shows test results.
 */
const ToolTestModal: React.FC<ToolTestModalProps> = ({
  isOpen,
  onClose,
  toolUuid,
  tool: initialTool,
}) => {
  const { t } = useTranslation();

  // State
  const [tool, setTool] = useState<ToolListItem | null>(initialTool || null);
  const [loading, setLoading] = useState(false);
  const [formValue, setFormValue] = useState<Record<string, unknown>>({});
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testResult, setTestResult] = useState<TestToolResponse | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Fetch tool details if only UUID is provided
  useEffect(() => {
    if (isOpen && toolUuid && !initialTool) {
      const fetchTool = async () => {
        setLoading(true);
        try {
          const fetchedTool = await toolsApi.getTool(toolUuid);
          setTool(fetchedTool);
        } catch (error: unknown) {
          console.error('Error fetching tool:', error);
          toast.error(t('tools.test.fetchError'));
          onClose();
        } finally {
          setLoading(false);
        }
      };
      fetchTool();
    } else if (initialTool) {
      setTool(initialTool);
    }
  }, [isOpen, toolUuid, initialTool, onClose, t]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormValue({});
      setTestStatus('idle');
      setTestResult(null);
      setTestError(null);
    }
  }, [isOpen]);

  // Get schema for the form
  const inputSchema: JSONSchemaDefinition | null = tool?.input_schema
    ? ({
        ...tool.input_schema,
        // Ensure it's not toggleable for test modal - we want all fields visible
        ui: { ...tool.input_schema.ui, toggleable: false },
      } as JSONSchemaDefinition)
    : null;

  // Handle form value change
  const handleFormChange = useCallback((newValue: Record<string, unknown>) => {
    setFormValue(newValue);
  }, []);

  // Run the test
  const handleTest = async () => {
    if (!tool) return;

    setTestStatus('loading');
    setTestResult(null);
    setTestError(null);

    try {
      const result = await toolsApi.testTool(tool.uuid, { input: formValue });
      setTestResult(result);
      setTestStatus('success');
      toast.success(t('tools.test.success'));
    } catch (error: unknown) {
      console.error('Error testing tool:', error);
      const errorMessage =
        (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.detail ||
        (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.message ||
        t('tools.test.error');
      setTestError(errorMessage);
      setTestStatus('error');
    }
  };

  // Reset and try again
  const handleReset = () => {
    setTestStatus('idle');
    setTestResult(null);
    setTestError(null);
  };

  // Render the result content
  const renderResult = () => {
    if (!testResult) return null;

    const content = testResult.content;
    const isString = typeof content === 'string';

    return (
      <div className="space-y-3">
        {/* Result Content */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-foreground">
            {t('tools.test.result')}
          </h4>
          <div className="max-h-64 overflow-auto rounded-md border border-border bg-muted/30 p-3">
            {isString ? (
              <pre className="whitespace-pre-wrap break-words text-sm text-foreground">
                {content}
              </pre>
            ) : (
              <pre className="whitespace-pre-wrap break-words font-mono text-xs text-foreground">
                {JSON.stringify(content, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Artifact if present */}
        {testResult.artifact && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-foreground">
              {t('tools.test.artifact')}
            </h4>
            <div className="max-h-32 overflow-auto rounded-md border border-border bg-muted/30 p-3">
              <pre className="whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
                {JSON.stringify(testResult.artifact, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Get tool type badge color
  const getToolTypeBadgeClass = (toolType: string) => {
    switch (toolType) {
      case 'mcp':
        return 'bg-info-soft text-info';
      case 'api_spec':
        return 'bg-warning-soft text-warning';
      case 'builtin':
        return 'bg-success-soft text-success';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('tools.test.title')}
      icon={BeakerIcon}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            {t('common.close')}
          </button>
          {testStatus === 'idle' || testStatus === 'loading' ? (
            <button
              type="button"
              onClick={handleTest}
              disabled={!tool || testStatus === 'loading'}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {testStatus === 'loading' ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  {t('tools.test.running')}
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" />
                  {t('tools.test.run')}
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              <ArrowPathIcon className="h-4 w-4" />
              {t('tools.test.tryAgain')}
            </button>
          )}
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loading />
        </div>
      ) : tool ? (
        <div className="space-y-4">
          {/* Tool Info Header */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-foreground">
                    {tool.name}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getToolTypeBadgeClass(tool.tool_type)}`}
                  >
                    {tool.tool_type.toUpperCase()}
                  </span>
                </div>
                {tool.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
                )}
                <p className="mt-1 font-mono text-xs text-muted-foreground">{tool.key}</p>
              </div>
            </div>
          </div>

          {/* Test Status Messages */}
          {testStatus === 'success' && (
            <div className="flex items-center gap-2 rounded-lg bg-success-soft p-3 text-success">
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{t('tools.test.successMessage')}</span>
            </div>
          )}

          {testStatus === 'error' && testError && (
            <div className="flex items-start gap-2 rounded-lg bg-danger-soft p-3 text-danger">
              <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium">{t('tools.test.errorMessage')}</span>
                <p className="mt-1 text-xs opacity-80">{testError}</p>
              </div>
            </div>
          )}

          {/* Form or Result */}
          {testStatus === 'success' || testStatus === 'error' ? (
            renderResult()
          ) : (
            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">
                {t('tools.test.parameters')}
              </h4>
              {inputSchema && Object.keys(inputSchema.properties || {}).length > 0 ? (
                <div className="rounded-lg border border-border bg-card p-4">
                  <JsonSchemaForm
                    schema={inputSchema}
                    value={formValue}
                    onChange={handleFormChange}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t('tools.test.noParameters')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          {t('tools.test.noTool')}
        </div>
      )}
    </Modal>
  );
};

/**
 * A button that opens the ToolTestModal.
 * Can be used inline in tool lists to trigger testing.
 */
interface ToolTestButtonProps {
  /** Tool UUID */
  toolUuid?: string;
  /** Tool object */
  tool?: ToolListItem;
  /** Custom label */
  label?: string;
  /** Compact mode - icon only */
  compact?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

export const ToolTestButton: React.FC<ToolTestButtonProps> = ({
  toolUuid,
  tool,
  label,
  compact = false,
  disabled = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const buttonLabel = label || t('tools.test.title');

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          className={`inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
          title={buttonLabel}
        >
          <BeakerIcon className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          className={`inline-flex items-center gap-1.5 rounded-md border border-input-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
          <BeakerIcon className="h-3.5 w-3.5" />
          <span>{buttonLabel}</span>
        </button>
      )}

      <ToolTestModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        toolUuid={toolUuid}
        tool={tool}
      />
    </>
  );
};

export default ToolTestModal;
