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
  SummarizerType
} from '../../../types/knowledge';
import { ListProviderConfig, Model } from '../../../types/provider';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useTeam } from '../../../contexts/TeamContext';
import { useTranslation } from 'react-i18next';



// Create validation schema for form - translations will be applied at runtime
const createSchema = (t: any) => yup.object().shape({
  title: yup.string().required(t('settings.knowledgeBase.form.basicInfo.nameRequired')),
  description: yup.string().required(t('settings.knowledgeBase.form.basicInfo.descriptionRequired')),
  embedding_model_id: yup.string().when('embeddingEnabled', {
    is: true,
    then: (schema) => schema.required(t('settings.knowledgeBase.form.embedding.modelRequired')),
    otherwise: (schema) => schema.nullable(),
  }),
  embedding_provider_config_id: yup.string().when('embeddingEnabled', {
    is: true,
    then: (schema) => schema.required(t('settings.knowledgeBase.form.embedding.providerConfigRequired')),
    otherwise: (schema) => schema.nullable(),
  }),
  chunk_size: yup.number().required(t('settings.knowledgeBase.form.chunking.chunkSizeRequired')).positive(t('settings.knowledgeBase.form.chunking.chunkSizePositive')),
  chunk_overlap: yup.number().required(t('settings.knowledgeBase.form.chunking.chunkOverlapRequired')).min(0, t('settings.knowledgeBase.form.chunking.chunkOverlapMin')),
  summarization_model_id: yup.string().nullable(),
  summarization_provider_config_id: yup.string().nullable(),
  summarizer_type: yup.string().oneOf(['standard', 'context_aware'], t('settings.knowledgeBase.form.summarization.typeInvalid')).required(t('settings.knowledgeBase.form.summarization.typeRequired')),
  summarizer_context: yup.string().when('summarizer_type', {
    is: 'context_aware',
    then: (schema) => schema.required(t('settings.knowledgeBase.form.summarization.contextRequired')),
    otherwise: (schema) => schema.nullable(),
  }),
  summarizer_temperature: yup.number().min(0, t('settings.knowledgeBase.form.summarization.temperatureMin')).max(2, t('settings.knowledgeBase.form.summarization.temperatureMax')),
  autoChunkOverlap: yup.boolean(),
  enhancementEnabled: yup.boolean().required(),
  embeddingEnabled: yup.boolean().required(),
  chunk_separator: yup.string()
});

const KnowledgeBaseNewPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [providerConfigs, setProviderConfigs] = useState<ListProviderConfig[]>([]);
  const [selectedEmbeddingProviderConfig, setSelectedEmbeddingProviderConfig] = useState<ListProviderConfig | null>(null);
  const [selectedSummarizationProviderConfig, setSelectedSummarizationProviderConfig] = useState<ListProviderConfig | null>(null);
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
      { label: t('settings.knowledgeBase.form.title'), href: '/dashboard/knowledge-base/new', current: true },
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

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<FormData>({
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
      chunk_separator: '' // Custom separator for text splitting
    }
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
    setSelectedEmbeddingProviderConfig(providerConfigs.find((config) => config.uuid === watchEmbeddingProviderConfig) || null);
  }, [watchEmbeddingProviderConfig, providerConfigs]);

  useEffect(() => {
    if (!watchSummarizationProviderConfig) return;
    setSelectedSummarizationProviderConfig(providerConfigs.find((config) => config.uuid === watchSummarizationProviderConfig) || null);
  }, [watchSummarizationProviderConfig, providerConfigs]);

  // Automatically calculate chunk overlap based on chunk size
  // Update chunk_overlap when chunk_size changes or autoChunkOverlap is checked
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if ((name === 'chunk_size' || name === 'autoChunkOverlap') && value.chunk_size && value.autoChunkOverlap) {
        setValue('chunk_overlap', calculateChunkOverlap(value.chunk_size));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  useEffect(() => {
    if (!watchSummarizationModelId) return;
    const selectedModel = selectedSummarizationProviderConfig?.available_llm_models.find(
      (model) => model.uuid === watchSummarizationModelId
    ) || null
    setIsTemperatureConfigurable(selectedModel?.min_temperature !== null && selectedModel?.max_temperature !== null);
    setSelectedSummarizationModel(selectedModel);
  }, [watchSummarizationModelId, selectedSummarizationProviderConfig]);

  const onSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      // Extract data for API calls
      const knowledgeBaseData = {
        title: formData.title,
        description: formData.description,
        embedding_model_id: formData.embeddingEnabled ? (formData.embedding_model_id || null) : null,
        embedding_provider_config_id: formData.embeddingEnabled ? (formData.embedding_provider_config_id || null) : null,
        chunk_size: formData.chunk_size,
        chunk_overlap: formData.chunk_overlap,
        summarization_model_id: formData.enhancementEnabled ? (formData.summarization_model_id || null) : null,
        summarization_provider_config_id: formData.enhancementEnabled ? (formData.summarization_provider_config_id || null) : null,
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
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
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
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.knowledgeBase.form.title')}</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          {t('settings.knowledgeBase.form.subtitle')}
        </p>
      </div>

      {isLoadingProviders && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loading size="lg" />
          <span className="mt-4 text-gray-600 dark:text-gray-400">{t('settings.knowledgeBase.loadingProviders')}</span>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">{t('settings.knowledgeBase.loadingMessage')}</p>
        </div>
      )}

      {!isLoadingProviders && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Content */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Form sections with clear visual separation */}
            <div className="space-y-8">
              {/* Basic Information Section */}
              <Card>
                <Card.Title
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  }
                >
                  {t('settings.knowledgeBase.form.basicInfo.title')}
                </Card.Title>
                <Card.Body>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('settings.knowledgeBase.form.basicInfo.name')}
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          id="title"
                          {...register('title')}
                          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md ${errors.title ? 'border-red-500' : ''}`}
                          placeholder={t('settings.knowledgeBase.form.basicInfo.namePlaceholder')}
                        />
                        {errors.title && (
                          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('settings.knowledgeBase.form.basicInfo.description')}
                      </label>
                      <div className="mt-2">
                        <textarea
                          id="description"
                          rows={3}
                          {...register('description')}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md"
                          placeholder={t('settings.knowledgeBase.form.basicInfo.descriptionPlaceholder')}
                        />
                      </div>
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Embedding Configuration Section */}
              <Card>
                <Card.Title
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  }
                >
                  {t('settings.knowledgeBase.form.embedding.title')}
                </Card.Title>
                <Card.Body>
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-s-4 border-blue-500 rounded">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {t('settings.knowledgeBase.form.embedding.description')}
                    </p>
                  </div>

                  {/* Embedding Enable/Disable Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {t('settings.knowledgeBase.form.embedding.vectorSearchMethod')}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <OptionCard
                        title={t('settings.knowledgeBase.form.embedding.semanticSearch')}
                        description={t('settings.knowledgeBase.form.embedding.semanticDescription')}
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                        isSelected={watchEmbeddingEnabled}
                        onClick={() => setValue('embeddingEnabled', true)}
                        badge={{
                          text: t('settings.knowledgeBase.form.embedding.recommended'),
                          color: "primary"
                        }}
                        iconBgColor="bg-green-100"
                        iconDarkBgColor="dark:bg-green-800/30"
                      />

                      <OptionCard
                        title={t('settings.knowledgeBase.form.embedding.textOnlySearch')}
                        description={t('settings.knowledgeBase.form.embedding.textOnlyDescription')}
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        }
                        isSelected={!watchEmbeddingEnabled}
                        onClick={() => setValue('embeddingEnabled', false)}
                        iconBgColor="bg-gray-100"
                        iconDarkBgColor="dark:bg-gray-800/30"
                      />
                    </div>
                  </div>
                  {watchEmbeddingEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="">
                        <label htmlFor="embedding_provider_config_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('settings.knowledgeBase.form.embedding.providerConfig')}
                        </label>
                        <div className="mt-2">
                          <Controller
                            name="embedding_provider_config_id"
                            control={control}
                            render={({ field }) => (
                              <ComboboxComponent
                                items={providerConfigs.map((config): ComboboxItem => ({
                                  id: config.uuid,
                                  label: config.title,
                                  category: config.provider_name
                                }))}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder={t('settings.knowledgeBase.form.embedding.providerConfigPlaceholder')}
                                disabled={!watchEmbeddingEnabled || isLoadingProviders}
                                className={errors.embedding_provider_config_id ? 'border-red-500' : ''}
                              />
                            )}
                          />
                          {errors.embedding_provider_config_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.embedding_provider_config_id.message}</p>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          {t('settings.knowledgeBase.form.embedding.providerConfigHelp')}
                        </p>
                      </div>

                      {/* Embedding Model Selection */}
                      <div className="">
                        <label htmlFor="embedding_model_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('settings.knowledgeBase.form.embedding.model')}
                        </label>
                        <div className="mt-2 relative">
                          <Controller
                            name="embedding_model_id"
                            control={control}
                            render={({ field }) => (
                              <ComboboxComponent
                                items={selectedEmbeddingProviderConfig?.available_embedding_models.map((model): ComboboxItem => ({
                                  id: model.uuid,
                                  label: `${model.name}${model.dimensions ? ` - ${model.dimensions} ${t('settings.knowledgeBase.form.embedding.dimensions')}` : ''}`,
                                  category: selectedEmbeddingProviderConfig?.provider_name
                                })) || []}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder={t('settings.knowledgeBase.form.embedding.modelPlaceholder')}
                                disabled={!watchEmbeddingEnabled || !watchEmbeddingProviderConfig}
                                className={errors.embedding_model_id ? 'border-red-500' : ''}
                              />
                            )}
                          />
                          {errors.embedding_model_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.embedding_model_id.message}</p>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          {t('settings.knowledgeBase.form.embedding.modelHelp')}
                        </p>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>


              {/* Chunking Configuration Section */}
              <Card>
                <Card.Title
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                    </svg>
                  }
                >
                  {t('settings.knowledgeBase.form.chunking.title')}
                </Card.Title>
                <Card.Body>
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-s-4 border-blue-500 rounded">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {t('settings.knowledgeBase.form.chunking.description')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                    <div>
                      <label htmlFor="chunk_size" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('settings.knowledgeBase.form.chunking.chunkSize')}
                      </label>
                      <div className="mt-2">
                        <input
                          type="number"
                          id="chunk_size"
                          min="1"
                          step="1"
                          {...register('chunk_size', { valueAsNumber: true })}
                          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md ${errors.chunk_size ? 'border-red-500' : ''}`}
                        />
                        {errors.chunk_size && (
                          <p className="mt-1 text-sm text-red-600">{errors.chunk_size.message}</p>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {t('settings.knowledgeBase.form.chunking.chunkSizeHelp')}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="chunk_overlap" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('settings.knowledgeBase.form.chunking.chunkOverlap')}
                        </label>
                        <Controller
                          name="autoChunkOverlap"
                          control={control}
                          render={({ field }) => (
                            <div className="flex items-center gap-2">
                              <label htmlFor="autoChunkOverlap" className="text-sm text-gray-700 dark:text-gray-300">
                                {t('settings.knowledgeBase.form.chunking.automatic')}
                              </label>
                              <input
                                type="checkbox"
                                id="autoChunkOverlap"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                title={t('settings.knowledgeBase.form.chunking.automaticTooltip')}
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
                        className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md ${watchAutoChunkOverlap ? 'bg-gray-100 dark:bg-gray-700' : ''} ${errors.chunk_overlap ? 'border-red-500' : ''}`}
                      />
                      {errors.chunk_overlap && (
                        <p className="mt-1 text-sm text-red-600">{errors.chunk_overlap.message}</p>
                      )}
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {t('settings.knowledgeBase.form.chunking.chunkOverlapHelp')}
                      </p>
                    </div>
                  </div>

                  {/* Separator Input */}
                  {/* <div className="md:w-1/2">
                    <label htmlFor="chunk_separator" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Separator
                    </label>
                    <input
                      type="text"
                      id="chunk_separator"
                      placeholder="Enter separator"
                      {...register('chunk_separator')}
                      className={`mt-2 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md ${errors.chunk_separator ? 'border-red-500' : ''}`}
                    />
                    {errors.chunk_separator && (
                      <p className="mt-1 text-sm text-red-600">{errors.chunk_separator.message}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Specify custom separators for text splitting. For multiple separators, use comma (,) to separate them.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
                      Note: Multiple separators are only used with RecursiveCharacterTextSplitter.
                    </p>
                  </div> */}
                </Card.Body>
              </Card>


              {/* Summarization Configuration Section */}
              <Card>
                <Card.Title
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  }
                >
                  {t('settings.knowledgeBase.form.summarization.title')}
                </Card.Title>
                <Card.Body>
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-s-4 border-blue-500 rounded">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {t('settings.knowledgeBase.form.summarization.description')}
                    </p>
                  </div>

                  {/* Index Method Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {t('settings.knowledgeBase.form.summarization.enableQuestion')}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <OptionCard
                        title={t('settings.knowledgeBase.form.summarization.enabledTitle')}
                        description={t('settings.knowledgeBase.form.summarization.enabledDescription')}
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 011.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                        }
                        isSelected={watchEnhancementEnabled}
                        onClick={() => setValue('enhancementEnabled', true)}
                        badge={{
                          text: t('settings.knowledgeBase.form.embedding.recommended'),
                          color: "primary"
                        }}
                        iconBgColor="bg-orange-100"
                        iconDarkBgColor="dark:bg-orange-800/30"
                      />

                      <OptionCard
                        title={t('settings.knowledgeBase.form.summarization.disabledTitle')}
                        description={t('settings.knowledgeBase.form.summarization.disabledDescription')}
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        }
                        isSelected={!watchEnhancementEnabled}
                        onClick={() => setValue('enhancementEnabled', false)}
                        iconBgColor="bg-blue-100"
                        iconDarkBgColor="dark:bg-blue-800/30"
                      />
                    </div>
                  </div>
                  {watchEnhancementEnabled && (
                    <>
                      <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 sm:col-span-6">
                          <label htmlFor="summarization_provider_config_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('settings.knowledgeBase.form.summarization.providerConfig')}
                          </label>
                          <div className="mt-2 relative">
                            <Controller
                              name="summarization_provider_config_id"
                              control={control}
                              render={({ field }) => (
                                <ComboboxComponent
                                  items={providerConfigs.map((config): ComboboxItem => ({
                                    id: config.uuid,
                                    label: config.title,
                                    category: config.provider_name
                                  }))}
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  placeholder={t('settings.knowledgeBase.form.summarization.providerConfigPlaceholder')}
                                  disabled={!watchEnhancementEnabled || isLoadingProviders}
                                  className={errors.summarization_provider_config_id ? 'border-red-500' : ''}
                                />
                              )}
                            />
                            {errors.summarization_provider_config_id && (
                              <p className="mt-1 text-sm text-red-600">{errors.summarization_provider_config_id.message}</p>
                            )}
                          </div>
                          <div className="mt-2 relative">
                            <Controller
                              name="summarization_model_id"
                              control={control}
                              render={({ field }) => (
                                <ComboboxComponent
                                  items={selectedSummarizationProviderConfig?.available_llm_models.map((model): ComboboxItem => ({
                                    id: model.uuid,
                                    label: model.name,
                                    category: selectedSummarizationProviderConfig?.provider_name
                                  })) || []}
                                  value={field.value || ''}
                                  onChange={field.onChange}
                                  placeholder={t('settings.knowledgeBase.form.summarization.modelPlaceholder')}
                                  disabled={!watchEnhancementEnabled || !watchSummarizationProviderConfig}
                                  className={errors.summarization_model_id ? 'border-red-500' : ''}
                                />
                              )}
                            />
                            {errors.summarization_model_id && (
                              <p className="mt-1 text-sm text-red-600">{errors.summarization_model_id.message}</p>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {t('settings.knowledgeBase.form.summarization.providerConfigHelp')}
                          </p>
                        </div>

                        <div className="col-span-12 sm:col-span-6">
                          <label htmlFor="summarizer_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('settings.knowledgeBase.form.summarization.type')}
                          </label>
                          <div className="mt-2">
                            <Controller
                              name="summarizer_type"
                              control={control}
                              render={({ field }) => (
                                <ComboboxComponent
                                  items={[
                                    { id: 'standard', label: t('settings.knowledgeBase.form.summarization.typeStandard') },
                                    { id: 'context_aware', label: t('settings.knowledgeBase.form.summarization.typeContextAware') }
                                  ]}
                                  value={field.value || 'standard'}
                                  onChange={field.onChange}
                                  placeholder={t('settings.knowledgeBase.form.summarization.type')}
                                  disabled={!watchEnhancementEnabled}
                                />
                              )}
                            />
                          </div>
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {t('settings.knowledgeBase.form.summarization.modelHelp')}
                          </p>
                        </div>

                        {/* Temperature Slider */}
                        <div className="col-span-12 sm:col-span-6">
                          <Controller
                            name="summarizer_temperature"
                            control={control}
                            render={({ field }) => {
                              console.log("isTemperatureConfigurable", isTemperatureConfigurable);
                              if (!watchEnhancementEnabled || !watchSummarizationModelId || !selectedSummarizationModel || !isTemperatureConfigurable) {
                                return (
                                  <div className="opacity-50">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      {t('settings.knowledgeBase.form.summarization.temperature')}
                                    </label>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {!isTemperatureConfigurable && selectedSummarizationModel
                                        ? "Temperature is handled internally by this model"
                                        : "Select a model to configure temperature"
                                      }
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <Slider
                                  label={t('settings.knowledgeBase.form.summarization.temperature')}
                                  value={field.value !== undefined && field.value !== null ? field.value : (selectedSummarizationModel?.default_temperature ?? 0.7)}
                                  onChange={field.onChange}
                                  min={selectedSummarizationModel.min_temperature!}
                                  max={selectedSummarizationModel.max_temperature!}
                                  step={0.1}
                                  formatValue={(val) => val.toFixed(1)}
                                  description={t('settings.knowledgeBase.form.summarization.temperatureHelp')}
                                />
                              );
                            }}
                          />
                        </div>
                      </div>

                      {watchSummarizerType === 'context_aware' && (
                        <>
                          <div className="grid grid-cols-12 gap-6 mt-6">
                            <div className="col-span-12">
                              <div className="flex justify-between items-center">
                                <label htmlFor="summarizer_context" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('settings.knowledgeBase.form.summarization.context')}
                                </label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setIsEnhanceModalOpen(true)}
                                  disabled={!watchSummarizationProviderConfig || !watchSummarizationModelId}
                                >
                                  {t('settings.knowledgeBase.form.summarization.enhanceButton')}
                                </Button>
                              </div>
                              <div className="mt-2">
                                <textarea
                                  id="summarizer_context"
                                  {...register('summarizer_context')}
                                  rows={4}
                                  className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md ${errors.summarizer_context ? 'border-red-500' : ''}`}
                                  placeholder={t('settings.knowledgeBase.form.summarization.contextPlaceholder')}
                                />
                                {errors.summarizer_context && (
                                  <p className="mt-1 text-sm text-red-600">{errors.summarizer_context.message}</p>
                                )}
                              </div>
                              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                {t('settings.knowledgeBase.form.summarization.contextHelp')}
                              </p>
                            </div>
                          </div>
                          {isEnhanceModalOpen && <EnhanceContextModal
                            isOpen={isEnhanceModalOpen}
                            onClose={() => setIsEnhanceModalOpen(false)}
                            onEnhance={(enhancedText) => {
                              setValue('summarizer_context', enhancedText, { shouldValidate: true });
                            }}
                            initialContext={watchSummarizerContext || ''}
                            providerConfigId={watchSummarizationProviderConfig || ''}
                            modelId={watchSummarizationModelId || ''}
                            temperature={isTemperatureConfigurable ? (watchSummarizerTemperature ?? null) : null}
                          />}
                        </>
                      )}
                    </>
                  )}
                </Card.Body>
              </Card>

              <div className="flex justify-end gap-4 pt-8 border-t border-gray-200 dark:border-gray-700 mt-10">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/knowledge-base')}
                  className="px-5 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('settings.knowledgeBase.form.submit.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loading size="sm" />
                      <span className="ms-2">{t('settings.knowledgeBase.form.submit.creating')}</span>
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
                embeddingProviderType={selectedEmbeddingProviderConfig?.is_global ? 'watercrawl' : 'external'}
                summarizationProviderType={selectedSummarizationProviderConfig?.is_global ? 'watercrawl' : 'external'}
                rateLimit={currentSubscription?.knowledge_base_retrival_rate_limit}
                numberOfDocumentsLimit={currentSubscription?.number_of_each_knowledge_base_documents}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default KnowledgeBaseNewPage;
