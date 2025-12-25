import React from 'react';

import { useTranslation } from 'react-i18next';

import { InformationCircleIcon } from '@heroicons/react/24/outline';

import Modal from './Modal';

interface ToolDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: {
    name: string;
    description?: string;
    key: string;
    input_schema?: Record<string, any>;
    [key: string]: any;
  } | null;
}

const ToolDetailModal: React.FC<ToolDetailModalProps> = ({
  isOpen,
  onClose,
  tool,
}) => {
  const { t } = useTranslation();

  if (!tool) return null;

  const renderInputSchema = () => {
    if (!tool.input_schema) {
      return (
        <div className="text-sm text-muted-foreground">
          {t('tools.noInputSchema')}
        </div>
      );
    }

    const properties = tool.input_schema.properties || {};
    const required = tool.input_schema.required || [];

    if (Object.keys(properties).length === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          {t('tools.noParameters')}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {Object.entries(properties).map(([key, schema]: [string, any]) => (
          <div
            key={key}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-x-2">
                  <code className="text-sm font-semibold text-foreground font-mono">
                    {key}
                  </code>
                  {required.includes(key) && (
                    <span className="inline-flex items-center rounded-md bg-destructive-soft px-2 py-0.5 text-xs font-medium text-destructive">
                      {t('common.required')}
                    </span>
                  )}
                  {schema.type && (
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {schema.type}
                    </span>
                  )}
                </div>
                {schema.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {schema.description}
                  </p>
                )}
                {schema.default !== undefined && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('common.default')}:{' '}
                    </span>
                    <code className="text-xs font-mono text-foreground">
                      {JSON.stringify(schema.default)}
                    </code>
                  </div>
                )}
                {schema.enum && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('common.options')}:{' '}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {schema.enum.map((value: any, idx: number) => (
                        <code
                          key={idx}
                          className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs font-mono text-foreground"
                        >
                          {String(value)}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tool.name}
      size="lg"
    >
      <div className="space-y-6">
        {/* Tool Key */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">
            {t('tools.toolKey')}
          </h3>
          <code className="inline-flex items-center rounded-md bg-muted px-3 py-1.5 text-sm font-mono text-foreground">
            {tool.key}
          </code>
        </div>

        {/* Description */}
        {tool.description && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-x-2">
              <InformationCircleIcon className="h-4 w-4" />
              {t('tools.description')}
            </h3>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {tool.description}
              </p>
            </div>
          </div>
        )}

        {/* Input Schema */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">
            {t('tools.inputParameters')}
          </h3>
          {renderInputSchema()}
        </div>

        {/* Raw Schema (Optional) */}
        {tool.input_schema && (
          <details className="group">
            <summary className="cursor-pointer text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
              {t('tools.viewRawSchema')}
            </summary>
            <div className="mt-2 rounded-lg border border-border bg-muted p-3">
              <pre className="text-xs font-mono text-foreground overflow-x-auto">
                {JSON.stringify(tool.input_schema, null, 2)}
              </pre>
            </div>
          </details>
        )}
      </div>
    </Modal>
  );
};

export default ToolDetailModal;
