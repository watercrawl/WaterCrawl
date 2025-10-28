import React, { useState, useEffect } from 'react';
import OptionCard from '../../../components/shared/OptionCard';
import Card from '../../../components/shared/Card';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { providerApi } from '../../../services/api/provider';
import Loading from '../../../components/shared/Loading';
import { Button } from '../../../components/shared/Button';
import { EnhanceContextModal } from '../../../components/knowledge/EnhanceContextModal';
import ComboboxComponent, { ComboboxItem } from '../../../components/shared/ComboboxComponent';
import Slider from '../../../components/shared/Slider';
import KnowledgeBasePricingInfo from '../../../components/knowledge/KnowledgeBasePricingInfo';
import {
  KnowledgeBaseFormData,
  DEFAULT_CHUNK_SIZE,
  calculateChunkOverlap,
  SummarizerType,
} from '../../../types/knowledge';
import { ListProviderConfig, Model } from '../../../types/provider';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useTeam } from '../../../contexts/TeamContext';
import { useTranslation } from 'react-i18next';
import {
  InformationCircleIcon,
  Squares2X2Icon,
  Square3Stack3DIcon,
  Bars3Icon,
  CheckCircleIcon,
  XCircleIcon,
  BoltIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

// Create validation schema for form - translations will be applied at runtime
const createSchema = (t: any) =>
  yup.object().shape({
    title: yup.string().required(t('settings.knowledgeBase.form.basicInfo.nameRequired')),
    description: yup
      .string()
      .required(t('settings.knowledgeBase.form.basicInfo.descriptionRequired')),
    embedding_model_id: yup.string().when('embeddingEnabled', {
      is: true,
      then: schema => schema.required(t('settings.knowledgeBase.form.embedding.modelRequired')),
      otherwise: schema => schema.nullable(),
    }),
    embedding_provider_config_id: yup.string().when('embeddingEnabled', {
      is: true,
      then: schema =>
        schema.required(t('settings.knowledgeBase.form.embedding.providerConfigRequired')),
      otherwise: schema => schema.nullable(),
    }),
    chunk_size: yup
      .number()
      .required(t('settings.knowledgeBase.form.chunking.chunkSizeRequired'))
      .positive(t('settings.knowledgeBase.form.chunking.chunkSizePositive')),
    chunk_overlap: yup
      .number()
      .required(t('settings.knowledgeBase.form.chunking.chunkOverlapRequired'))
      .min(0, t('settings.knowledgeBase.form.chunking.chunkOverlapMin')),
    summarization_model_id: yup.string().nullable(),
    summarization_provider_config_id: yup.string().nullable(),
    summarizer_type: yup
      .string()
      .oneOf(
        ['standard', 'context_aware'],
        t('settings.knowledgeBase.form.summarization.typeInvalid')
      )
      .required(t('settings.knowledgeBase.form.summarization.typeRequired')),
    summarizer_context: yup.string().when('summarizer_type', {
      is: 'context_aware',
      then: schema =>
        schema.required(t('settings.knowledgeBase.form.summarization.contextRequired')),
      otherwise: schema => schema.nullable(),
    }),
    summarizer_temperature: yup
      .number()
      .min(0, t('settings.knowledgeBase.form.summarization.temperatureMin'))
      .max(2, t('settings.knowledgeBase.form.summarization.temperatureMax')),
    autoChunkOverlap: yup.boolean(),
    enhancementEnabled: yup.boolean().required(),
    embeddingEnabled: yup.boolean().required(),
    chunk_separator: yup.string(),
  });

const KnowledgeBaseNewPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [providerConfigs, setProviderConfigs] = useState<ListProviderConfig[]>([]);
  const [selectedEmbeddingProviderConfig, setSelectedEmbeddingProviderConfig] =
    useState<ListProviderConfig | null>(null);
  const [selectedSummarizationProviderConfig, setSelectedSummarizationProviderConfig] =
    useState<ListProviderConfig | null>(null);
  const [selectedSummarizationModel, setSelectedSummarizationModel] = useState<Model | null>(null);
  const [isTemperatureConfigurable, setIsTemperatureConfigurable] = useState(false);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [isEnhanceModalOpen, setIsEnhanceModalOpen] = useState(false);
  const { setItems } = useBreadcrumbs();
  const { currentSubscription } = useTeam();

  // Fetch provider configs
  useEffect(() => {
    setItems([
      { label: t('common.dashboard'), href: '/dashboard' },
      { label: t('settings.knowledgeBase.title'), href: '/dashboard/knowledge-base' },
      {
        label: t('settings.knowledgeBase.form.title'),
        href: '/dashboard/knowledge-base/new',
        current: true,
      },
    ]);

    const fetchProviderConfigs = async () => {
      setIsLoadingProviders(true);
      try {
        const response = await providerApi.listAllProviderConfigs();
        setProviderConfigs(response || []);
      } catch (error) {
        console.error('Failed to fetch provider configs:', error);
        toast.error(t('settings.knowledgeBase.toast.providerConfigError'));
      } finally {
        setIsLoadingProviders(false);
      }
    };

    fetchProviderConfigs();
  }, [setItems, t]);

  // Define a type that extends KnowledgeBaseFormData with our additional UI control fields
  type FormData = KnowledgeBaseFormData & {
    autoChunkOverlap: boolean;
    enhancementEnabled: boolean;
    embeddingEnabled: boolean;
    chunk_separator?: string;
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(createSchema(t)) as any,
    defaultValues: {
      title: '',
      description: '',
      embedding_model_id: '', // Will be set when models are loaded
      embedding_provider_config_id: '', // Will need to be selected by user
      chunk_size: DEFAULT_CHUNK_SIZE,
      chunk_overlap: calculateChunkOverlap(DEFAULT_CHUNK_SIZE),
      autoChunkOverlap: true, // Use auto chunk overlap by default
      summarization_model_id: '', // Will be set when models are loaded
      summarization_provider_config_id: '', // Will need to be selected by user
      summarizer_type: SummarizerType.Standard, // Default summarizer type
      summarizer_context: '',
      summarizer_temperature: 0.7,
      enhancementEnabled: false, // Default to no enhancement (economical)
      embeddingEnabled: false, // Default to embeddings enabled
      chunk_separator: '', // Custom separator for text splitting
    },
  });

  // Watch values needed for UI rendering and conditional logic
  const {
    embedding_provider_config_id: watchEmbeddingProviderConfig,
    summarization_provider_config_id: watchSummarizationProviderConfig,
    summarization_model_id: watchSummarizationModelId,
    summarizer_type: watchSummarizerType,
    summarizer_context: watchSummarizerContext,
    summarizer_temperature: watchSummarizerTemperature,
    // chunk_size: watchChunkSize,
    autoChunkOverlap: watchAutoChunkOverlap,
    enhancementEnabled: watchEnhancementEnabled,
    embeddingEnabled: watchEmbeddingEnabled,
  } = watch();

  useEffect(() => {
    if (!watchEmbeddingProviderConfig) return;
    setSelectedEmbeddingProviderConfig(
      providerConfigs.find(config => config.uuid === watchEmbeddingProviderConfig) || null
    );
  }, [watchEmbeddingProviderConfig, providerConfigs]);

  useEffect(() => {
    if (!watchSummarizationProviderConfig) return;
    setSelectedSummarizationProviderConfig(
      providerConfigs.find(config => config.uuid === watchSummarizationProviderConfig) || null
    );
  }, [watchSummarizationProviderConfig, providerConfigs]);

  // Automatically calculate chunk overlap based on chunk size
  // Update chunk_overlap when chunk_size changes or autoChunkOverlap is checked
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (
        (name === 'chunk_size' || name === 'autoChunkOverlap') &&
        value.chunk_size &&
        value.autoChunkOverlap
      ) {
        setValue('chunk_overlap', calculateChunkOverlap(value.chunk_size));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  useEffect(() => {
    if (!watchSummarizationModelId) return;
    const selectedModel =
      selectedSummarizationProviderConfig?.available_llm_models.find(
        model => model.uuid === watchSummarizationModelId
      ) || null;
    setIsTemperatureConfigurable(
      selectedModel?.min_temperature !== null && selectedModel?.max_temperature !== null
    );
    setSelectedSummarizationModel(selectedModel);
  }, [watchSummarizationModelId, selectedSummarizationProviderConfig]);

  const onSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      // Extract data for API calls
      const knowledgeBaseData = {
        title: formData.title,
        description: formData.description,
        embedding_model_id: formData.embeddingEnabled ? formData.embedding_model_id || null : null,
        embedding_provider_config_id: formData.embeddingEnabled
          ? formData.embedding_provider_config_id || null
          : null,
        chunk_size: formData.chunk_size,
        chunk_overlap: formData.chunk_overlap,
        summarization_model_id: formData.enhancementEnabled
          ? formData.summarization_model_id || null
          : null,
        summarization_provider_config_id: formData.enhancementEnabled
          ? formData.summarization_provider_config_id || null
          : null,
        summarizer_type: formData.summarizer_type,
        summarizer_context:
          formData.enhancementEnabled && formData.summarizer_type === 'context_aware'
            ? formData.summarizer_context
            : undefined,
        summarizer_temperature:
          formData.enhancementEnabled && isTemperatureConfigurable
            ? formData.summarizer_temperature
            : undefined,
      };
      const response = await knowledgeBaseApi.create(knowledgeBaseData);
      toast.success(t('settings.knowledgeBase.toast.createSuccess'));
      // Navigate to the knowledge base detail page
      navigate(`/dashboard/knowledge-base/${response.uuid}`);
    } catch (error: any) {
      console.error('Failed to create knowledge base:', error);
      // Handle specific API errors if available
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          // Display detailed validation errors if available
          const errorMessages = Object.entries(errorData)
            .map(
              ([field, messages]) =>
                `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
            )
            .join('\n');
          toast.error(`Failed to create knowledge base: ${errorMessages}`);
        } else {
          toast.error(`Failed to create knowledge base: ${errorData}`);
        }
      } else {
        toast.error(t('settings.knowledgeBase.toast.createError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground">
          {t('settings.knowledgeBase.form.title')}
        </h1>
        <p className="mt-2 text-sm text-foreground">{t('settings.knowledgeBase.form.subtitle')}</p>
      </div>

      {isLoadingProviders && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loading size="lg" />
          <span className="mt-4 text-muted-foreground">
            {t('settings.knowledgeBase.loadingProviders')}
          </span>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('settings.knowledgeBase.loadingMessage')}
          </p>
        </div>
      )}

      {!isLoadingProviders && (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Form Content */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Form sections with clear visual separation */}
              <div className="space-y-8">
                {/* Basic Information Section */}
                <Card>
                  <Card.Title icon={<InformationCircleIcon className="h-5 w-5 text-primary" />}>
                    {t('settings.knowledgeBase.form.basicInfo.title')}
                  </Card.Title>
                  <Card.Body>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="">
                        <label
                          htmlFor="title"
                          className="block text-sm font-medium text-foreground"
                        >
                          {t('settings.knowledgeBase.form.basicInfo.name')}
                        </label>
                        <div className="mt-2">
                          <input
                            type="text"
                            id="title"
                            {...register('title')}
                            className={`block w-full rounded-md border-input-border bg-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${errors.title ? 'border-error' : ''}`}
                            placeholder={t('settings.knowledgeBase.form.basicInfo.namePlaceholder')}
                          />
                          {errors.title && (
                            <p className="mt-1 text-sm text-error">{errors.title.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="">
                        <label
                          htmlFor="description"
                          className="block text-sm font-medium text-foreground"
                        >
                          {t('settings.knowledgeBase.form.basicInfo.description')}
                        </label>
                        <div className="mt-2">
                          <textarea
                            id="description"
                            rows={3}
                            {...register('description')}
                            className={`block w-full rounded-md border-input-border bg-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${errors.description ? 'border-error' : ''}`}
                            placeholder={t(
                              'settings.knowledgeBase.form.basicInfo.descriptionPlaceholder'
                            )}
                          />
                        </div>
                        {errors.description && (
                          <p className="mt-1 text-sm text-error">{errors.description.message}</p>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>

                {/* Embedding Configuration Section */}
                <Card>
                  <Card.Title icon={<Squares2X2Icon className="h-5 w-5 text-primary" />}>
                    {t('settings.knowledgeBase.form.embedding.title')}
                  </Card.Title>
                  <Card.Body>
                    <div className="mb-4 rounded border-s-4 border-info-dark bg-info-light p-3">
                      <p className="text-sm text-info-dark">
                        {t('settings.knowledgeBase.form.embedding.description')}
                      </p>
                    </div>
                    {/* Embedding Enable/Disable Selection */}
                    <div className="mb-6">
                      <label className="mb-3 block text-sm font-medium text-foreground">
                        {t('settings.knowledgeBase.form.embedding.vectorSearchMethod')}
                      </label>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <OptionCard
                          title={t('settings.knowledgeBase.form.embedding.semanticSearch')}
                          description={t(
                            'settings.knowledgeBase.form.embedding.semanticDescription'
                          )}
                          icon={<CheckCircleIcon className="h-3 w-3 text-success" />}
                          isSelected={watchEmbeddingEnabled}
                          onClick={() => setValue('embeddingEnabled', true)}
                          badge={{
                            text: t('settings.knowledgeBase.form.embedding.recommended'),
                            color: 'primary',
                          }}
                          iconBgColor="bg-success-light"
                          iconDarkBgColor=""
                        />{' '}
                        <OptionCard
                          title={t('settings.knowledgeBase.form.embedding.textOnlySearch')}
                          description={t(
                            'settings.knowledgeBase.form.embedding.textOnlyDescription'
                          )}
                          icon={<XCircleIcon className="h-3 w-3 text-muted-foreground" />}
                          isSelected={!watchEmbeddingEnabled}
                          onClick={() => setValue('embeddingEnabled', false)}
                          iconBgColor="bg-muted"
                          iconDarkBgColor=""
                        />{' '}
                      </div>{' '}
                    </div>{' '}
                    {watchEmbeddingEnabled && (
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {' '}
                        <div className="">
                          {' '}
                          <label
                            htmlFor="embedding_provider_config_id"
                            className="block text-sm font-medium text-foreground"
                          >
                            {' '}
                            {t('settings.knowledgeBase.form.embedding.providerConfig')}
                          </label>
                          <div className="mt-2">
                            <Controller
                              name="embedding_provider_config_id"
                              control={control}
                              render={({ field }) => (
                                <ComboboxComponent
                                  items={providerConfigs.map(
                                    (config): ComboboxItem => ({
                                      id: config.uuid,
                                      label: config.title,
                                      category: config.provider_name,
                                    })
                                  )}
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  placeholder={t(
                                    'settings.knowledgeBase.form.embedding.providerConfigPlaceholder'
                                  )}
                                  disabled={!watchEmbeddingEnabled || isLoadingProviders}
                                  className={
                                    errors.embedding_provider_config_id ? 'border-error' : ''
                                  }
                                />
                              )}
                            />
                            {errors.embedding_provider_config_id && (
                              <p className="mt-1 text-sm text-error">
                                {errors.embedding_provider_config_id.message}
                              </p>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {t('settings.knowledgeBase.form.embedding.providerConfigHelp')}
                          </p>
                        </div>
                        {/* Embedding Model Selection */}
                        <div className="">
                          <label
                            htmlFor="embedding_model_id"
                            className="block text-sm font-medium text-foreground"
                          >
                            {t('settings.knowledgeBase.form.embedding.model')}
                          </label>
                          <div className="relative mt-2">
                            <Controller
                              name="embedding_model_id"
                              control={control}
                              render={({ field }) => (
                                <ComboboxComponent
                                  items={
                                    selectedEmbeddingProviderConfig?.available_embedding_models.map(
                                      (model): ComboboxItem => ({
                                        id: model.uuid,
                                        label: `${model.name}${model.dimensions ? ` - ${model.dimensions} ${t('settings.knowledgeBase.form.embedding.dimensions')}` : ''}`,
                                        category: selectedEmbeddingProviderConfig?.provider_name,
                                      })
                                    ) || []
                                  }
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  placeholder={t(
                                    'settings.knowledgeBase.form.embedding.modelPlaceholder'
                                  )}
                                  disabled={!watchEmbeddingEnabled || !watchEmbeddingProviderConfig}
                                  className={errors.embedding_model_id ? 'border-error' : ''}
                                />
                              )}
                            />
                            {errors.embedding_model_id && (
                              <p className="mt-1 text-sm text-error">
                                {errors.embedding_model_id.message}
                              </p>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {t('settings.knowledgeBase.form.embedding.modelHelp')}
                          </p>
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Chunking Configuration Section */}
                <Card>
                  <Card.Title icon={<Square3Stack3DIcon className="h-5 w-5 text-primary" />}>
                    {t('settings.knowledgeBase.form.chunking.title')}
                  </Card.Title>
                  <Card.Body>
                    <div className="mb-4 rounded border-s-4 border-info-dark bg-info-light p-3">
                      <p className="text-sm text-info-dark">
                        {t('settings.knowledgeBase.form.chunking.description')}
                      </p>
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-8 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="chunk_size"
                          className="block text-sm font-medium text-foreground"
                        >
                          {t('settings.knowledgeBase.form.chunking.chunkSize')}
                        </label>
                        <div className="mt-2">
                          <input
                            type="number"
                            id="chunk_size"
                            min="1"
                            step="1"
                            {...register('chunk_size', { valueAsNumber: true })}
                            className={`block w-full rounded-md border-input-border bg-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${errors.chunk_size ? 'border-error' : ''}`}
                          />
                          {errors.chunk_size && (
                            <p className="mt-1 text-sm text-error">{errors.chunk_size.message}</p>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {t('settings.knowledgeBase.form.chunking.chunkSizeHelp')}
                        </p>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label
                            htmlFor="chunk_overlap"
                            className="text-sm font-medium text-foreground"
                          >
                            {t('settings.knowledgeBase.form.chunking.chunkOverlap')}
                          </label>
                          <Controller
                            name="autoChunkOverlap"
                            control={control}
                            render={({ field: { value, onChange, ...field } }) => (
                              <div className="flex items-center gap-2">
                                <label
                                  htmlFor="autoChunkOverlap"
                                  className="text-sm text-foreground"
                                >
                                  {t('settings.knowledgeBase.form.chunking.automatic')}
                                </label>
                                <input
                                  type="checkbox"
                                  id="autoChunkOverlap"
                                  checked={!!value}
                                  onChange={e => onChange(e.target.checked)}
                                  className="h-4 w-4 rounded border-input-border text-primary focus:ring-primary"
                                  title={t('settings.knowledgeBase.form.chunking.automaticTooltip')}
                                  {...field}
                                />
                              </div>
                            )}
                          />
                        </div>
                        <input
                          type="number"
                          id="chunk_overlap"
                          min="0"
                          step="1"
                          disabled={watchAutoChunkOverlap}
                          {...register('chunk_overlap', { valueAsNumber: true })}
                          className={`block w-full rounded-md border-input-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${watchAutoChunkOverlap ? 'bg-muted' : 'bg-input'} ${errors.chunk_overlap ? 'border-error' : ''}`}
                        />
                        {errors.chunk_overlap && (
                          <p className="mt-1 text-sm text-error">{errors.chunk_overlap.message}</p>
                        )}
                        <p className="mt-2 text-sm text-muted-foreground">
                          {t('settings.knowledgeBase.form.chunking.chunkOverlapHelp')}
                        </p>
                      </div>
                    </div>

                    {/* Separator Input */}
                    {/* <div className="md:w-1/2">
                    <label htmlFor="chunk_separator" className="block text-sm font-medium text-foreground">
                      Separator
                    </label>
                    <input
                      type="text"
                      id="chunk_separator"
                      placeholder="Enter separator"
                      {...register('chunk_separator')}
                      className={`block w-full rounded-md border-input-border bg-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${errors.chunk_separator ? 'border-error' : ''}`}
                    />
                    {errors.chunk_separator && (
                      <p className="mt-1 text-sm text-error">{errors.chunk_separator.message}</p>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">
                      Specify custom separators for text splitting. For multiple separators, use comma (,) to separate them.
                    </p>
                    <p className="text-xs text-muted-foreground italic mt-1">
                      Note: Multiple separators are only used with RecursiveCharacterTextSplitter.
                    </p>
                  </div> */}
                  </Card.Body>
                </Card>

                {/* Summarization Configuration Section */}
                <Card>
                  <Card.Title icon={<Bars3Icon className="h-5 w-5 text-primary" />}>
                    {t('settings.knowledgeBase.form.summarization.title')}
                  </Card.Title>
                  <Card.Body>
                    <div className="mb-4 rounded border-s-4 border-info-dark bg-info-light p-3">
                      <p className="text-sm text-info-dark">
                        {t('settings.knowledgeBase.form.summarization.description')}
                      </p>
                    </div>
                    {/* Index Method Selection */}
                    <div className="mb-6">
                      <label className="mb-3 block text-sm font-medium text-foreground">
                        {t('settings.knowledgeBase.form.summarization.enableQuestion')}
                      </label>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <OptionCard
                          title={t('settings.knowledgeBase.form.summarization.enabledTitle')}
                          description={t(
                            'settings.knowledgeBase.form.summarization.enabledDescription'
                          )}
                          icon={<BoltIcon className="h-3 w-3 text-warning" />}
                          isSelected={watchEnhancementEnabled}
                          onClick={() => setValue('enhancementEnabled', true)}
                          badge={{
                            text: t('settings.knowledgeBase.form.embedding.recommended'),
                            color: 'primary',
                          }}
                          iconBgColor="bg-warning-light"
                          iconDarkBgColor=""
                        />{' '}
                        <OptionCard
                          title={t('settings.knowledgeBase.form.summarization.disabledTitle')}
                          description={t(
                            'settings.knowledgeBase.form.summarization.disabledDescription'
                          )}
                          icon={<TagIcon className="h-3 w-3 text-muted-foreground" />}
                          isSelected={!watchEnhancementEnabled}
                          onClick={() => setValue('enhancementEnabled', false)}
                          iconBgColor="bg-muted"
                          iconDarkBgColor=""
                        />{' '}
                      </div>{' '}
                    </div>{' '}
                    {watchEnhancementEnabled && (
                      <>
                        {' '}
                        <div className="grid grid-cols-12 gap-6">
                          {' '}
                          <div className="col-span-12 sm:col-span-6">
                            {' '}
                            <label
                              htmlFor="summarization_provider_config_id"
                              className="block text-sm font-medium text-foreground"
                            >
                              {' '}
                              {t('settings.knowledgeBase.form.summarization.providerConfig')}
                            </label>
                            <div className="relative mt-2">
                              <Controller
                                name="summarization_provider_config_id"
                                control={control}
                                render={({ field }) => (
                                  <ComboboxComponent
                                    items={providerConfigs.map(
                                      (config): ComboboxItem => ({
                                        id: config.uuid,
                                        label: config.title,
                                        category: config.provider_name,
                                      })
                                    )}
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    placeholder={t(
                                      'settings.knowledgeBase.form.summarization.providerConfigPlaceholder'
                                    )}
                                    disabled={!watchEnhancementEnabled || isLoadingProviders}
                                    className={
                                      errors.summarization_provider_config_id ? 'border-error' : ''
                                    }
                                  />
                                )}
                              />
                              {errors.summarization_provider_config_id && (
                                <p className="mt-1 text-sm text-error">
                                  {errors.summarization_provider_config_id.message}
                                </p>
                              )}
                            </div>
                            <div className="relative mt-2">
                              <Controller
                                name="summarization_model_id"
                                control={control}
                                render={({ field }) => (
                                  <ComboboxComponent
                                    items={
                                      selectedSummarizationProviderConfig?.available_llm_models.map(
                                        (model): ComboboxItem => ({
                                          id: model.uuid,
                                          label: model.name,
                                          category:
                                            selectedSummarizationProviderConfig?.provider_name,
                                        })
                                      ) || []
                                    }
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    placeholder={t(
                                      'settings.knowledgeBase.form.summarization.modelPlaceholder'
                                    )}
                                    disabled={
                                      !watchEnhancementEnabled || !watchSummarizationProviderConfig
                                    }
                                    className={errors.summarization_model_id ? 'border-error' : ''}
                                  />
                                )}
                              />
                              {errors.summarization_model_id && (
                                <p className="mt-1 text-sm text-error">
                                  {errors.summarization_model_id.message}
                                </p>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {t('settings.knowledgeBase.form.summarization.providerConfigHelp')}
                            </p>
                          </div>
                          <div className="col-span-12 sm:col-span-6">
                            <label
                              htmlFor="summarizer_type"
                              className="block text-sm font-medium text-foreground"
                            >
                              {t('settings.knowledgeBase.form.summarization.type')}
                            </label>
                            <div className="mt-2">
                              <Controller
                                name="summarizer_type"
                                control={control}
                                render={({ field }) => (
                                  <ComboboxComponent
                                    items={[
                                      {
                                        id: 'standard',
                                        label: t(
                                          'settings.knowledgeBase.form.summarization.typeStandard'
                                        ),
                                      },
                                      {
                                        id: 'context_aware',
                                        label: t(
                                          'settings.knowledgeBase.form.summarization.typeContextAware'
                                        ),
                                      },
                                    ]}
                                    value={field.value || 'standard'}
                                    onChange={field.onChange}
                                    placeholder={t(
                                      'settings.knowledgeBase.form.summarization.type'
                                    )}
                                    disabled={!watchEnhancementEnabled}
                                  />
                                )}
                              />
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {t('settings.knowledgeBase.form.summarization.modelHelp')}
                            </p>
                          </div>
                          {/* Temperature Slider */}
                          <div className="col-span-12 sm:col-span-6">
                            <Controller
                              name="summarizer_temperature"
                              control={control}
                              render={({ field }) => {
                                console.log('isTemperatureConfigurable', isTemperatureConfigurable);
                                if (
                                  !watchEnhancementEnabled ||
                                  !watchSummarizationModelId ||
                                  !selectedSummarizationModel ||
                                  !isTemperatureConfigurable
                                ) {
                                  return (
                                    <div className="opacity-50">
                                      <label className="mb-2 block text-sm font-medium text-foreground">
                                        {t('settings.knowledgeBase.form.summarization.temperature')}
                                      </label>
                                      <div className="text-sm text-muted-foreground">
                                        {!isTemperatureConfigurable && selectedSummarizationModel
                                          ? 'Temperature is handled internally by this model'
                                          : 'Select a model to configure temperature'}
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <Slider
                                    label={t(
                                      'settings.knowledgeBase.form.summarization.temperature'
                                    )}
                                    value={
                                      field.value !== undefined && field.value !== null
                                        ? field.value
                                        : (selectedSummarizationModel?.default_temperature ?? 0.7)
                                    }
                                    onChange={field.onChange}
                                    min={selectedSummarizationModel.min_temperature!}
                                    max={selectedSummarizationModel.max_temperature!}
                                    step={0.1}
                                    formatValue={val => val.toFixed(1)}
                                    description={t(
                                      'settings.knowledgeBase.form.summarization.temperatureHelp'
                                    )}
                                  />
                                );
                              }}
                            />
                          </div>
                        </div>
                        {watchSummarizerType === 'context_aware' && (
                          <>
                            <div className="mt-6 grid grid-cols-12 gap-6">
                              <div className="col-span-12">
                                <div className="flex items-center justify-between">
                                  <label
                                    htmlFor="summarizer_context"
                                    className="block text-sm font-medium text-foreground"
                                  >
                                    {t('settings.knowledgeBase.form.summarization.context')}
                                  </label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEnhanceModalOpen(true)}
                                    disabled={
                                      !watchSummarizationProviderConfig ||
                                      !watchSummarizationModelId
                                    }
                                  >
                                    {t('settings.knowledgeBase.form.summarization.enhanceButton')}
                                  </Button>
                                </div>
                                <div className="mt-2">
                                  <textarea
                                    id="summarizer_context"
                                    {...register('summarizer_context')}
                                    rows={4}
                                    className={`block w-full rounded-md border-input-border bg-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${errors.summarizer_context ? 'border-error' : ''}`}
                                    placeholder={t(
                                      'settings.knowledgeBase.form.summarization.contextPlaceholder'
                                    )}
                                  />
                                  {errors.summarizer_context && (
                                    <p className="mt-1 text-sm text-error">
                                      {errors.summarizer_context.message}
                                    </p>
                                  )}
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                  {t('settings.knowledgeBase.form.summarization.contextHelp')}
                                </p>
                              </div>
                            </div>
                            {isEnhanceModalOpen && (
                              <EnhanceContextModal
                                isOpen={isEnhanceModalOpen}
                                onClose={() => setIsEnhanceModalOpen(false)}
                                onEnhance={enhancedText => {
                                  setValue('summarizer_context', enhancedText, {
                                    shouldValidate: true,
                                  });
                                }}
                                initialContext={watchSummarizerContext || ''}
                                providerConfigId={watchSummarizationProviderConfig || ''}
                                modelId={watchSummarizationModelId || ''}
                                temperature={
                                  isTemperatureConfigurable
                                    ? (watchSummarizerTemperature ?? null)
                                    : null
                                }
                              />
                            )}
                          </>
                        )}
                      </>
                    )}
                  </Card.Body>
                </Card>

                <div className="mt-10 flex justify-end gap-4 border-t border-border pt-8">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/knowledge-base')}
                    className="rounded-md border border-input-border bg-card px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {t('settings.knowledgeBase.form.submit.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loading size="sm" />
                        <span className="ms-2">
                          {t('settings.knowledgeBase.form.submit.creating')}
                        </span>
                      </>
                    ) : (
                      t('settings.knowledgeBase.form.submit.create')
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Sticky Pricing Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <KnowledgeBasePricingInfo
                isEmbeddingEnabled={watchEmbeddingEnabled}
                isEnhancementEnabled={watchEnhancementEnabled}
                embeddingProviderType={
                  selectedEmbeddingProviderConfig?.is_global ? 'watercrawl' : 'external'
                }
                summarizationProviderType={
                  selectedSummarizationProviderConfig?.is_global ? 'watercrawl' : 'external'
                }
                rateLimit={currentSubscription?.knowledge_base_retrival_rate_limit}
                numberOfDocumentsLimit={
                  currentSubscription?.number_of_each_knowledge_base_documents
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseNewPage;
