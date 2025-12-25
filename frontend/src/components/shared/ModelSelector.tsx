import React, { useState, useEffect, useMemo, Fragment, useCallback } from 'react';

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
  Transition,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, Cog6ToothIcon, LinkIcon } from '@heroicons/react/20/solid';

import { providerApi } from '../../services/api/provider';
import { ListProviderConfig, Model, ProviderEmbedding } from '../../types/provider';

import { LLMConfigButton } from './LLMConfigModal';

// Type guard to check if model has parameters_schema
const hasParametersSchema = (
  model: Model | ProviderEmbedding | null
): model is Model | ProviderEmbedding => {
  return model !== null && 'parameters_schema' in model && model.parameters_schema !== null;
};

export type ModelType = 'reranker' | 'llm' | 'embedding';

interface ModelSelectorProps {
  /** Type of models to show */
  modelType: ModelType;
  /** Initial provider config UUID */
  initialProviderConfigId?: string | null;
  /** Initial model key */
  initialModelKey?: string | null;
  /** Initial model config JSON */
  initialModelConfig?: Record<string, any> | null;
  /** Callback when values change */
  onChange: (values: {
    provider_config_id: string | null;
    model_key: string | null;
    model_config: Record<string, any>;
  }) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Label for the selector */
  label?: string;
  /** Whether to show the label (default: true). Set to false when label is provided outside the component */
  showLabel?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Required field */
  required?: boolean;
}

interface ModelOption {
  modelKey: string;
  modelLabel: string;
  providerConfigs: Array<{
    uuid: string;
    title: string;
    providerName: string;
  }>;
  model: Model | ProviderEmbedding;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  modelType,
  initialProviderConfigId,
  initialModelKey,
  initialModelConfig,
  onChange,
  disabled = false,
  label,
  showLabel = true,
  placeholder,
  error,
  required = false,
}) => {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<ListProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedModelKey, setSelectedModelKey] = useState<string | null>(
    initialModelKey || null
  );
  const [selectedProviderConfigId, setSelectedProviderConfigId] = useState<string | null>(
    initialProviderConfigId || null
  );
  const [modelConfig, setModelConfig] = useState<Record<string, any>>(
    initialModelConfig || {}
  );
  const [showProviderSelectionModal, setShowProviderSelectionModal] = useState(false);
  const [pendingModelKey, setPendingModelKey] = useState<string | null>(null);
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Fetch provider configs on mount
  useEffect(() => {
    const fetchProviders = async () => {
      setIsLoading(true);
      try {
        const data = await providerApi.listAllProviderConfigs();
        setProviders(data || []);
      } catch (error) {
        console.error('Failed to fetch provider configs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, []);

  // Update dropdown position
  useEffect(() => {
    const updateDropdownPosition = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const minSpaceNeeded = 200;

      if (spaceBelow < minSpaceNeeded && rect.top > minSpaceNeeded) {
        setPosition('top');
      } else {
        setPosition('bottom');
      }
    };

    const handlePositionUpdate = () => {
      setTimeout(updateDropdownPosition, 0);
    };

    updateDropdownPosition();
    window.addEventListener('resize', handlePositionUpdate);
    window.addEventListener('scroll', handlePositionUpdate, true);

    return () => {
      window.removeEventListener('resize', handlePositionUpdate);
      window.removeEventListener('scroll', handlePositionUpdate, true);
    };
  }, []);

  // Get models based on model type
  const getModelsForProvider = useCallback((provider: ListProviderConfig): (Model | ProviderEmbedding)[] => {
    switch (modelType) {
      case 'reranker':
        return provider.available_reranker_models || [];
      case 'llm':
        return provider.available_llm_models || [];
      case 'embedding':
        return provider.available_embedding_models || [];
      default:
        return [];
    }
  }, [modelType]);

  // Build model options grouped by model key
  const modelOptions = useMemo(() => {
    const modelMap = new Map<string, ModelOption>();

    providers.forEach(provider => {
      const models = getModelsForProvider(provider);
      models.forEach(model => {
        const existing = modelMap.get(model.key);
        if (existing) {
          // Model exists in multiple providers
          existing.providerConfigs.push({
            uuid: provider.uuid,
            title: provider.title,
            providerName: provider.provider_name,
          });
        } else {
          // New model
          modelMap.set(model.key, {
            modelKey: model.key,
            modelLabel: model.label,
            providerConfigs: [
              {
                uuid: provider.uuid,
                title: provider.title,
                providerName: provider.provider_name,
              },
            ],
            model,
          });
        }
      });
    });

    return Array.from(modelMap.values());
  }, [providers, getModelsForProvider]);

  // Filter models based on search query
  const filteredOptions = useMemo(() => {
    if (query === '') return modelOptions;

    const lowerQuery = query.toLowerCase();
    return modelOptions.filter(
      option =>
        option.modelLabel.toLowerCase().includes(lowerQuery) ||
        option.modelKey.toLowerCase().includes(lowerQuery) ||
        option.providerConfigs.some(pc =>
          pc.providerName.toLowerCase().includes(lowerQuery) ||
          pc.title.toLowerCase().includes(lowerQuery)
        )
    );
  }, [modelOptions, query]);

  // Get selected model option
  const selectedOption = useMemo(() => {
    if (!selectedModelKey) return null;
    return modelOptions.find(opt => opt.modelKey === selectedModelKey) || null;
  }, [modelOptions, selectedModelKey]);

  // Get selected model object
  const selectedModel = useMemo(() => {
    if (!selectedProviderConfigId || !selectedModelKey) return null;

    const provider = providers.find(p => p.uuid === selectedProviderConfigId);
    if (!provider) return null;

    const models = getModelsForProvider(provider);
    return models.find(m => m.key === selectedModelKey) || null;
  }, [providers, selectedProviderConfigId, selectedModelKey, getModelsForProvider]);

  // Handle model selection
  const handleModelSelect = (modelKey: string) => {
    const option = modelOptions.find(opt => opt.modelKey === modelKey);
    if (!option) return;

    // If model is available in multiple providers, show selection modal
    if (option.providerConfigs.length > 1) {
      setPendingModelKey(modelKey);
      setShowProviderSelectionModal(true);
    } else {
      // Single provider, select directly
      const providerConfigId = option.providerConfigs[0].uuid;
      setSelectedModelKey(modelKey);
      setSelectedProviderConfigId(providerConfigId);
      setModelConfig({});
      onChange({
        provider_config_id: providerConfigId,
        model_key: modelKey,
        model_config: {},
      });
    }
  };

  // Handle provider selection from modal
  const handleProviderSelect = (providerConfigId: string) => {
    if (!pendingModelKey) return;

    setSelectedModelKey(pendingModelKey);
    setSelectedProviderConfigId(providerConfigId);
    setModelConfig({});
    setShowProviderSelectionModal(false);
    setPendingModelKey(null);

    onChange({
      provider_config_id: providerConfigId,
      model_key: pendingModelKey,
      model_config: {},
    });
  };

  // Handle model config change
  const handleModelConfigChange = (config: Record<string, any>) => {
    setModelConfig(config);
    onChange({
      provider_config_id: selectedProviderConfigId,
      model_key: selectedModelKey,
      model_config: config,
    });
  };

  // Get display value
  const getDisplayValue = () => {
    if (!selectedModelKey || !selectedOption) return '';
    return selectedOption.modelLabel;
  };

  // Group filtered options by provider name for display
  const groupedOptions = useMemo(() => {
    const groups = new Map<string, ModelOption[]>();

    filteredOptions.forEach(option => {
      option.providerConfigs.forEach(pc => {
        const groupKey = pc.providerName;
        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }
        // Only add if not already in group (avoid duplicates)
        const groupItems = groups.get(groupKey)!;
        if (!groupItems.find(item => item.modelKey === option.modelKey)) {
          groupItems.push(option);
        }
      });
    });

    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredOptions]);

  // Check if there are any models available
  const hasModels = modelOptions.length > 0;
  const hasProviders = providers.length > 0;

  return (
    <div className="w-full" ref={containerRef}>
      {label && showLabel && (
        <label className="mb-1 block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-error ms-1">*</span>}
        </label>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <Combobox
            value={selectedModelKey || ''}
            onChange={(value: string | null) => {
              if (value) {
                handleModelSelect(value);
              } else {
                setSelectedModelKey(null);
                setSelectedProviderConfigId(null);
                setModelConfig({});
                onChange({
                  provider_config_id: null,
                  model_key: null,
                  model_config: {},
                });
              }
            }}
            disabled={disabled || isLoading}
            as="div"
            className="relative"
          >
            <div className="group relative w-full cursor-pointer rounded-md">
              <div className="relative w-full overflow-hidden rounded-md border border-input-border text-start sm:text-sm">
                <Combobox.Button className="w-full text-start">
                  <ComboboxInput
                    className="w-full cursor-pointer border-none bg-transparent py-2 pe-10 ps-10 text-sm leading-5 text-foreground focus:ring-0"
                    placeholder={placeholder || t('common.selectOption')}
                    displayValue={() => getDisplayValue()}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setQuery(event.target.value)
                    }
                    disabled={disabled || isLoading}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  />
                  <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
                    <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  </div>
                </Combobox.Button>

                {selectedModelKey && (
                  <div className="absolute inset-y-0 end-0 z-10 flex items-center pe-2">
                    <button
                      type="button"
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedModelKey(null);
                        setSelectedProviderConfigId(null);
                        setModelConfig({});
                        onChange({
                          provider_config_id: null,
                          model_key: null,
                          model_config: {},
                        });
                      }}
                      className="text-muted-foreground hover:text-foreground focus:outline-none"
                      disabled={disabled}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => setQuery('')}
              >
                <ComboboxOptions
                  className={`${
                    position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
                  } scrollbar-thin scrollbar-thumb-gray-400 absolute z-50 max-h-60 w-full overflow-auto rounded-md border border-border bg-card py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm`}
                >
                  {isLoading ? (
                    <div className="relative cursor-default select-none px-4 py-2 text-foreground">
                      {t('common.loading')}
                    </div>
                  ) : !hasProviders ? (
                    <div className="p-4">
                      <div className="rounded-md border border-warning-strong bg-warning-soft p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <Cog6ToothIcon className="h-5 w-5 text-warning-strong" aria-hidden="true" />
                          </div>
                          <div className="ms-3 flex-1">
                            <h3 className="text-sm font-medium text-warning-strong">
                              {t('common.noProviderConfigs')}
                            </h3>
                            <div className="mt-2 text-sm text-warning-strong">
                              <p>{t('common.noProviderConfigsMessage')}</p>
                              <Link
                                to="/dashboard/settings#provider-config"
                                className="mt-2 inline-flex items-center gap-1 font-medium text-warning-strong hover:text-warning-strong/80 underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <LinkIcon className="h-4 w-4" />
                                {t('common.goToProviderConfigs')}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : !hasModels ? (
                    <div className="p-4">
                      <div className="rounded-md border border-info-strong bg-info-soft p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <Cog6ToothIcon className="h-5 w-5 text-info-strong" aria-hidden="true" />
                          </div>
                          <div className="ms-3 flex-1">
                            <h3 className="text-sm font-medium text-info-strong">
                              {t('common.noModelsAvailable')}
                            </h3>
                            <div className="mt-2 text-sm text-info-strong">
                              <p>{t('common.noModelsAvailableMessage', { modelType: modelType })}</p>
                              <Link
                                to="/dashboard/settings#provider-config"
                                className="mt-2 inline-flex items-center gap-1 font-medium text-info-strong hover:text-info-strong/80 underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <LinkIcon className="h-4 w-4" />
                                {t('common.goToProviderConfigs')}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : filteredOptions.length === 0 && query !== '' ? (
                    <div className="relative cursor-default select-none px-4 py-2 text-foreground">
                      {t('common.nothingFound')}
                    </div>
                  ) : (
                    groupedOptions.map(([providerName, options]) => (
                      <div key={providerName}>
                        <div className="bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground">
                          {providerName}
                        </div>
                        {options.map(option => (
                          <ComboboxOption
                            key={option.modelKey}
                            className={({ active }: { active: boolean }) =>
                              `relative select-none py-2 pe-4 ps-10 ${
                                disabled
                                  ? 'cursor-not-allowed text-muted-foreground'
                                  : active
                                    ? 'cursor-default bg-primary text-white'
                                    : 'cursor-default text-foreground'
                              }`
                            }
                            value={option.modelKey}
                            disabled={disabled}
                          >
                            {({ selected, active }: { selected: boolean; active: boolean }) => (
                              <>
                                <span
                                  className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
                                >
                                  {option.modelLabel}
                                  {option.providerConfigs.length > 1 && (
                                    <span className="ms-2 text-xs opacity-70">
                                      ({option.providerConfigs.length} {t('common.providers')})
                                    </span>
                                  )}
                                </span>
                                {selected ? (
                                  <span
                                    className={`absolute inset-y-0 start-0 flex items-center ps-3 ${
                                      active ? 'text-white' : 'text-primary'
                                    }`}
                                  >
                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </ComboboxOption>
                        ))}
                      </div>
                    ))
                  )}
                </ComboboxOptions>
              </Transition>
            </div>
          </Combobox>
        </div>

        {/* Model Config Button */}
        {selectedModel && hasParametersSchema(selectedModel) && (
          <LLMConfigButton
            model={selectedModel}
            value={modelConfig}
            onChange={handleModelConfigChange}
            disabled={disabled || !selectedModelKey}
            compact
            modalTitle={t('common.configureModel')}
          />
        )}
      </div>

      {error && <p className="mt-1 text-sm text-error">{error}</p>}

      {/* Provider Selection Modal */}
      <Dialog
        open={showProviderSelectionModal}
        onClose={() => {
          setShowProviderSelectionModal(false);
          setPendingModelKey(null);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-md rounded-lg bg-card p-6 shadow-xl">
            <DialogTitle className="text-lg font-medium text-foreground mb-4">
              {t('common.selectProvider')}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mb-4">
              {t('common.modelAvailableInMultipleProviders')}
            </p>
            <div className="space-y-2">
              {pendingModelKey &&
                modelOptions
                  .find(opt => opt.modelKey === pendingModelKey)
                  ?.providerConfigs.map(pc => (
                    <button
                      key={pc.uuid}
                      type="button"
                      onClick={() => handleProviderSelect(pc.uuid)}
                      className="w-full rounded-md border border-border bg-card px-4 py-3 text-left hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <div className="font-medium text-foreground">{pc.title}</div>
                      <div className="text-sm text-muted-foreground">{pc.providerName}</div>
                    </button>
                  ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowProviderSelectionModal(false);
                  setPendingModelKey(null);
                }}
                className="rounded-md border border-input-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                {t('common.cancel')}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};

export default ModelSelector;

