import React, { useState, useEffect, useCallback, Fragment } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { Dialog, Transition, Tab, TransitionChild, DialogPanel, TabPanels, TabPanel, TabList, TabGroup } from '@headlessui/react';
import {
  XMarkIcon,
  PlayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  BeakerIcon,
  ClipboardDocumentIcon,
  ServerIcon,
  WrenchIcon,
  SparklesIcon,
  CodeBracketIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

import { JsonSchemaForm } from '../json-forms/JsonSchemaForm';

import { toolsApi } from '../../services/api/tools';

import Loading from './Loading';
import MarkdownRenderer from './MarkdownRenderer';


import type { ToolListItem, TestToolResponse } from '../../types/tools';
import type { JSONSchemaDefinition } from '../json-forms/types/schema';

interface ToolDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Called when the drawer should close */
  onClose: () => void;
  /** Tool UUID - will fetch tool details */
  toolUuid?: string;
  /** Tool object - if provided, won't fetch */
  tool?: ToolListItem;
  /** Initial tab to show */
  initialTab?: 'details' | 'test';
}

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * A slide-out drawer for viewing tool details and testing.
 * Combines both detail view and testing in a unified, user-friendly interface.
 */
const ToolDrawer: React.FC<ToolDrawerProps> = ({
  isOpen,
  onClose,
  toolUuid,
  tool: initialTool,
  initialTab = 'details',
}) => {
  const { t } = useTranslation();

  // State
  const [tool, setTool] = useState<ToolListItem | null>(initialTool || null);
  const [loading, setLoading] = useState(false);
  const [formValue, setFormValue] = useState<Record<string, unknown>>({});
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testResult, setTestResult] = useState<TestToolResponse | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [showRawSchema, setShowRawSchema] = useState(false);
  const [selectedTabIndex, setSelectedTabIndex] = useState(initialTab === 'test' ? 1 : 0);

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
          toast.error(t('tools.drawer.fetchError'));
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
      setSelectedTabIndex(initialTab === 'test' ? 1 : 0);
    }
  }, [isOpen, initialTab]);

  // Get schema for the form - preserve $defs for $ref resolution
  const inputSchema: (JSONSchemaDefinition & { $defs?: Record<string, JSONSchemaDefinition> }) | null = tool?.input_schema
    ? ({
        ...tool.input_schema,
        ui: { ...tool.input_schema.ui, toggleable: false },
        $defs: (tool.input_schema as any).$defs,
      } as JSONSchemaDefinition & { $defs?: Record<string, JSONSchemaDefinition> })
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
    } catch (error: unknown) {
      console.error('Error testing tool:', error);
      const errorMessage =
        (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.detail ||
        (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.message ||
        t('tools.drawer.testError');
      setTestError(errorMessage);
      setTestStatus('error');
    }
  };

  // Reset test
  const handleReset = () => {
    setTestStatus('idle');
    setTestResult(null);
    setTestError(null);
  };

  // Copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('common.copied'));
  };

  // Get tool type info
  const getToolTypeInfo = (toolType: string) => {
    switch (toolType) {
      case 'mcp':
        return {
          icon: ServerIcon,
          label: 'MCP',
          color: 'text-info',
          bg: 'bg-info-soft',
        };
      case 'api_spec':
        return {
          icon: WrenchIcon,
          label: 'API',
          color: 'text-warning',
          bg: 'bg-warning-soft',
        };
      case 'built_in':
      default:
        return {
          icon: SparklesIcon,
          label: t('tools.builtin'),
          color: 'text-primary',
          bg: 'bg-primary-soft',
        };
    }
  };

  // Render parameter documentation
  const renderParameterDocs = () => {
    if (!tool?.input_schema) {
      return (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
          <CodeBracketIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">{t('tools.drawer.noParameters')}</p>
        </div>
      );
    }

    const properties = (tool.input_schema.properties || {}) as Record<string, JSONSchemaDefinition>;
    const required = (tool.input_schema.required || []) as string[];

    if (Object.keys(properties).length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
          <CodeBracketIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">{t('tools.drawer.noParameters')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {Object.entries(properties).map(([key, schema]) => (
          <div
            key={key}
            className="group rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="text-sm font-semibold text-foreground">{key}</code>
                  {required.includes(key) && (
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-danger bg-danger-soft">
                      {t('common.required')}
                    </span>
                  )}
                  {typeof schema.type === 'string' && (
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted">
                      {schema.type}
                    </span>
                  )}
                </div>
                {typeof schema.description === 'string' && (
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {schema.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {schema.default !== undefined && (
                    <div className="inline-flex items-center gap-1 rounded bg-muted/50 px-2 py-1">
                      <span className="text-[10px] font-medium uppercase text-muted-foreground">
                        {t('common.default')}:
                      </span>
                      <code className="text-xs text-foreground">{JSON.stringify(schema.default)}</code>
                    </div>
                  )}
                  {schema.enum && Array.isArray(schema.enum) && (
                    <div className="flex flex-wrap gap-1">
                      {schema.enum.map((value, idx) => (
                        <code
                          key={idx}
                          className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs text-foreground"
                        >
                          {String(value)}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render test result
  const renderTestResult = () => {
    if (!testResult) return null;

    const content = testResult.content;
    const isString = typeof content === 'string';

    return (
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">{t('tools.drawer.result')}</h4>
            <button
              onClick={() => handleCopy(isString ? content : JSON.stringify(content, null, 2))}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ClipboardDocumentIcon className="h-3.5 w-3.5" />
              {t('common.copy')}
            </button>
          </div>
          <div className="max-h-80 overflow-auto rounded-lg border border-border bg-muted/30 p-4">
            {isString ? (
              <pre className="whitespace-pre-wrap break-words text-sm text-foreground font-mono">
                {content}
              </pre>
            ) : (
              <pre className="whitespace-pre-wrap break-words text-sm text-foreground font-mono">
                {JSON.stringify(content, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {testResult.artifact && (
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">{t('tools.drawer.artifact')}</h4>
            <div className="max-h-40 overflow-auto rounded-lg border border-border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground font-mono">
                {JSON.stringify(testResult.artifact, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  const toolTypeInfo = tool ? getToolTypeInfo(tool.tool_type) : null;
  const TypeIcon = toolTypeInfo?.icon || SparklesIcon;

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
        </TransitionChild>

        {/* Drawer */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full ps-10">
              <TransitionChild
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel className="pointer-events-auto w-screen max-w-xl">
                  <div className="flex h-full flex-col bg-background shadow-2xl">
                    {loading ? (
                      <div className="flex flex-1 items-center justify-center">
                        <Loading />
                      </div>
                    ) : tool ? (
                      <>
                        {/* Header */}
                        <div className="border-b border-border bg-card px-6 py-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 min-w-0 flex-1">
                              <div
                                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${toolTypeInfo?.bg}`}
                              >
                                <TypeIcon className={`h-6 w-6 ${toolTypeInfo?.color}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <Dialog.Title className="text-lg font-semibold text-foreground truncate">
                                    {tool.name}
                                  </Dialog.Title>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toolTypeInfo?.bg} ${toolTypeInfo?.color}`}
                                  >
                                    {toolTypeInfo?.label}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleCopy(tool.key)}
                                  className="mt-1 inline-flex items-center gap-1.5 rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors group"
                                >
                                  <span className="truncate max-w-[280px]">{tool.key}</span>
                                  <ClipboardDocumentIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={onClose}
                              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        {/* Tabs */}
                        <TabGroup selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex} className="flex flex-1 flex-col min-h-0">
                          <TabList className="flex flex-shrink-0 border-b border-border bg-card/50">
                            <Tab
                              className={({ selected }) =>
                                `flex-1 px-4 py-3 text-sm font-medium transition-colors outline-none ${
                                  selected
                                    ? 'text-primary border-b-2 border-primary -mb-px'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`
                              }
                            >
                              <span className="flex items-center justify-center gap-2">
                                <InformationCircleIcon className="h-4 w-4" />
                                {t('tools.drawer.tabDetails')}
                              </span>
                            </Tab>
                            <Tab
                              className={({ selected }) =>
                                `flex-1 px-4 py-3 text-sm font-medium transition-colors outline-none ${
                                  selected
                                    ? 'text-primary border-b-2 border-primary -mb-px'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`
                              }
                            >
                              <span className="flex items-center justify-center gap-2">
                                <BeakerIcon className="h-4 w-4" />
                                {t('tools.drawer.tabTest')}
                              </span>
                            </Tab>
                          </TabList>

                          <TabPanels className="flex-1 overflow-y-auto min-h-0">
                            {/* Details Tab */}
                            <TabPanel className="p-6 space-y-6 outline-none">
                              {/* Description */}
                              {tool.description && (
                                <div>
                                  <h3 className="text-sm font-semibold text-foreground mb-3">
                                    {t('tools.drawer.description')}
                                  </h3>
                                  <div className="rounded-lg border border-border bg-card p-4">
                                    <MarkdownRenderer
                                      content={tool.description}
                                      className="text-sm text-muted-foreground prose-sm"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Parameters */}
                              <div>
                                <h3 className="text-sm font-semibold text-foreground mb-3">
                                  {t('tools.drawer.parameters')}
                                </h3>
                                {renderParameterDocs()}
                              </div>

                              {/* Raw Schema */}
                              {tool.input_schema && (
                                <div>
                                  <button
                                    onClick={() => setShowRawSchema(!showRawSchema)}
                                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    {showRawSchema ? (
                                      <ChevronDownIcon className="h-4 w-4" />
                                    ) : (
                                      <ChevronRightIcon className="h-4 w-4" />
                                    )}
                                    {t('tools.drawer.rawSchema')}
                                  </button>
                                  {showRawSchema && (
                                    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4">
                                      <div className="flex justify-end mb-2">
                                        <button
                                          onClick={() =>
                                            handleCopy(JSON.stringify(tool.input_schema, null, 2))
                                          }
                                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                        >
                                          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                                          {t('common.copy')}
                                        </button>
                                      </div>
                                      <pre className="text-xs font-mono text-foreground overflow-x-auto">
                                        {JSON.stringify(tool.input_schema, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </TabPanel>

                            {/* Test Tab */}
                            <TabPanel className="p-6 space-y-6 outline-none">
                              {/* Status Messages */}
                              {testStatus === 'success' && (
                                <div className="flex items-center gap-3 rounded-lg bg-success-soft p-4">
                                  <CheckCircleIcon className="h-5 w-5 text-success flex-shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium text-success">
                                      {t('tools.drawer.testSuccess')}
                                    </p>
                                    <p className="text-xs text-success/80 mt-0.5">
                                      {t('tools.drawer.testSuccessMessage')}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {testStatus === 'error' && testError && (
                                <div className="flex items-start gap-3 rounded-lg bg-danger-soft p-4">
                                  <ExclamationCircleIcon className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-danger">
                                      {t('tools.drawer.testFailed')}
                                    </p>
                                    <p className="text-xs text-danger/80 mt-1 break-words">
                                      {testError}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Form or Result */}
                              {testStatus === 'success' || testStatus === 'error' ? (
                                <>
                                  {renderTestResult()}
                                  <button
                                    onClick={handleReset}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                                  >
                                    <ArrowPathIcon className="h-4 w-4" />
                                    {t('tools.drawer.testAgain')}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-3">
                                      {t('tools.drawer.inputValues')}
                                    </h3>
                                    {inputSchema &&
                                    Object.keys(inputSchema.properties || {}).length > 0 ? (
                                      <div className="rounded-lg border border-border bg-card p-4">
                                        <JsonSchemaForm
                                          schema={inputSchema}
                                          value={formValue}
                                          onChange={handleFormChange}
                                        />
                                      </div>
                                    ) : (
                                      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
                                        <BeakerIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
                                        <p className="mt-2 text-sm text-muted-foreground">
                                          {t('tools.drawer.noInputRequired')}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    onClick={handleTest}
                                    disabled={testStatus === 'loading'}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {testStatus === 'loading' ? (
                                      <>
                                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                        {t('tools.drawer.running')}
                                      </>
                                    ) : (
                                      <>
                                        <PlayIcon className="h-4 w-4" />
                                        {t('tools.drawer.runTest')}
                                      </>
                                    )}
                                  </button>
                                </>
                              )}
                            </TabPanel>
                          </TabPanels>
                        </TabGroup>
                      </>
                    ) : (
                      <div className="flex flex-1 items-center justify-center">
                        <p className="text-muted-foreground">{t('tools.drawer.notFound')}</p>
                      </div>
                    )}
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ToolDrawer;

/**
 * A button that opens the ToolDrawer.
 */
interface ToolDrawerButtonProps {
  /** Tool UUID */
  toolUuid?: string;
  /** Tool object */
  tool?: ToolListItem;
  /** Button variant */
  variant?: 'icon' | 'text' | 'full';
  /** Initial tab */
  initialTab?: 'details' | 'test';
  /** Additional className */
  className?: string;
}

export const ToolDrawerButton: React.FC<ToolDrawerButtonProps> = ({
  toolUuid,
  tool,
  variant = 'icon',
  initialTab = 'details',
  className = '',
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'icon') {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${className}`}
          title={initialTab === 'test' ? t('tools.drawer.testTool') : t('tools.drawer.viewDetails')}
        >
          {initialTab === 'test' ? (
            <BeakerIcon className="h-4 w-4" />
          ) : (
            <InformationCircleIcon className="h-4 w-4" />
          )}
        </button>
        <ToolDrawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          toolUuid={toolUuid}
          tool={tool}
          initialTab={initialTab}
        />
      </>
    );
  }

  if (variant === 'text') {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover transition-colors ${className}`}
        >
          {initialTab === 'test' ? (
            <>
              <BeakerIcon className="h-3.5 w-3.5" />
              {t('tools.drawer.testTool')}
            </>
          ) : (
            <>
              <InformationCircleIcon className="h-3.5 w-3.5" />
              {t('tools.drawer.viewDetails')}
            </>
          )}
        </button>
        <ToolDrawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          toolUuid={toolUuid}
          tool={tool}
          initialTab={initialTab}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors ${className}`}
      >
        {initialTab === 'test' ? (
          <>
            <BeakerIcon className="h-4 w-4 text-primary" />
            {t('tools.drawer.testTool')}
          </>
        ) : (
          <>
            <InformationCircleIcon className="h-4 w-4 text-primary" />
            {t('tools.drawer.viewDetails')}
          </>
        )}
      </button>
      <ToolDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        toolUuid={toolUuid}
        tool={tool}
        initialTab={initialTab}
      />
    </>
  );
};
