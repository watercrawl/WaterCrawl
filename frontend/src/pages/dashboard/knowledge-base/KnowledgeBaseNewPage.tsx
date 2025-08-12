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
import { ListProviderConfig } from '../../../types/provider';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useTeam } from '../../../contexts/TeamContext';



// Create validation schema for form
const schema = yup.object().shape({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  embedding_model_id: yup.string().when('embeddingEnabled', {
    is: true,
    then: (schema) => schema.required('Embedding model is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  embedding_provider_config_id: yup.string().when('embeddingEnabled', {
    is: true,
    then: (schema) => schema.required('Embedding provider config is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  chunk_size: yup.number().required('Chunk size is required').positive('Chunk size must be positive'),
  chunk_overlap: yup.number().required('Chunk overlap is required').min(0, 'Chunk overlap cannot be negative'),
  summarization_model_id: yup.string().nullable(),
  summarization_provider_config_id: yup.string().nullable(),
  summarizer_type: yup.string().oneOf(['standard', 'context_aware'], 'Invalid summarizer type').required('Summarizer type is required'),
  summarizer_context: yup.string().when('summarizer_type', {
    is: 'context_aware',
    then: (schema) => schema.required('Context is required for context-aware summarization'),
    otherwise: (schema) => schema.nullable(),
  }),
  summarizer_temperature: yup.number().min(0, 'Temperature must be at least 0').max(2, 'Temperature must be at most 2'),
  autoChunkOverlap: yup.boolean(),
  enhancementEnabled: yup.boolean().required(),
  embeddingEnabled: yup.boolean().required(),
  chunk_separator: yup.string()
});

const KnowledgeBaseNewPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [providerConfigs, setProviderConfigs] = useState<ListProviderConfig[]>([]);
  const [selectedEmbeddingProviderConfig, setSelectedEmbeddingProviderConfig] = useState<ListProviderConfig | null>(null);
  const [selectedSummarizationProviderConfig, setSelectedSummarizationProviderConfig] = useState<ListProviderConfig | null>(null);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [isEnhanceModalOpen, setIsEnhanceModalOpen] = useState(false);
  const { setItems } = useBreadcrumbs();
  const { currentSubscription } = useTeam();

  // Fetch provider configs
  useEffect(() => {
    setItems([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Knowledge Bases', href: '/dashboard/knowledge-base' },
      { label: 'Create Knowledge Base', href: '/dashboard/knowledge-base/new', current: true },
    ]);

    const fetchProviderConfigs = async () => {
      setIsLoadingProviders(true);
      try {
        const response = await providerApi.listAllProviderConfigs();
        setProviderConfigs(response || []);
      } catch (error) {
        console.error('Failed to fetch provider configs:', error);
        toast.error('Failed to load provider configurations');
      } finally {
        setIsLoadingProviders(false);
      }
    };

    fetchProviderConfigs();
  }, [setItems]);

  // Define a type that extends KnowledgeBaseFormData with our additional UI control fields
  type FormData = KnowledgeBaseFormData & {
    autoChunkOverlap: boolean;
    enhancementEnabled: boolean;
    embeddingEnabled: boolean;
    chunk_separator?: string;
  };

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
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
          formData.enhancementEnabled
            ? formData.summarizer_temperature
            : undefined,
      };
      const response = await knowledgeBaseApi.create(knowledgeBaseData);
      toast.success('Knowledge base created successfully!');
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
        toast.error('Failed to create knowledge base. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Knowledge Base</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Configure your knowledge base settings for optimal information retrieval.
        </p>
      </div>

      {isLoadingProviders && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loading size="lg" />
          <span className="mt-4 text-gray-600 dark:text-gray-400">Loading provider configurations...</span>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">This may take a few moments...</p>
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
                  Basic Information
                </Card.Title>
                <Card.Body>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Title
                      </label>
                      <div className="mt-2">
                        <input
                          type="text"
                          id="title"
                          {...register('title')}
                          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md ${errors.title ? 'border-red-500' : ''}`}
                          placeholder="My Knowledge Base"
                        />
                        {errors.title && (
                          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </label>
                      <div className="mt-2">
                        <textarea
                          id="description"
                          rows={3}
                          {...register('description')}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md"
                          placeholder="Description for this knowledge base"
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
                  Embedding Configuration
                </Card.Title>
                <Card.Body>
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Embeddings convert text into numerical vectors for semantic search. Choose whether to enable embeddings for your knowledge base.
                    </p>
                  </div>

                  {/* Embedding Enable/Disable Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Vector Search Method
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <OptionCard
                        title="Semantic Search"
                        description="Enable embeddings to convert text into vectors for semantic similarity search."
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                        isSelected={watchEmbeddingEnabled}
                        onClick={() => setValue('embeddingEnabled', true)}
                        badge={{
                          text: "Recommended",
                          color: "primary"
                        }}
                        iconBgColor="bg-green-100"
                        iconDarkBgColor="dark:bg-green-800/30"
                      />

                      <OptionCard
                        title="Text-only Search"
                        description="Skip embeddings for a lighter setup. Search will be based on exact text matching only."
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
                          Embedding Provider Configuration
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
                                placeholder="Select a provider config"
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
                          Select the provider configuration for embeddings.
                        </p>
                      </div>

                      {/* Embedding Model Selection */}
                      <div className="">
                        <label htmlFor="embedding_model_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Embedding Model
                        </label>
                        <div className="mt-2 relative">
                          <Controller
                            name="embedding_model_id"
                            control={control}
                            render={({ field }) => (
                              <ComboboxComponent
                                items={selectedEmbeddingProviderConfig?.available_embedding_models.map((model): ComboboxItem => ({
                                  id: model.uuid,
                                  label: `${model.name}${model.dimensions ? ` - ${model.dimensions} dimensions` : ''}`,
                                  category: selectedEmbeddingProviderConfig?.provider_name
                                })) || []}
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder="Select a model"
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
                          Select the embedding model to use for this knowledge base.
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
                  Chunking Configuration
                </Card.Title>
                <Card.Body>
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Proper text chunking is essential for effective information retrieval. Chunks should be large enough to capture context but small enough for precise matching.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                    <div>
                      <label htmlFor="chunk_size" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Chunk Size
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
                        Number of characters per chunk. Recommended: 1000-1500 characters.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="chunk_overlap" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Chunk Overlap
                        </label>
                        <Controller
                          name="autoChunkOverlap"
                          control={control}
                          render={({ field }) => (
                            <div className="flex items-center gap-2">
                              <label htmlFor="autoChunkOverlap" className="text-sm text-gray-700 dark:text-gray-300">
                                Automatic
                              </label>
                              <input
                                type="checkbox"
                                id="autoChunkOverlap"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                title="When enabled, chunk overlap will be automatically set to 20% of chunk size"
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
                        Number of characters to overlap between chunks to maintain context.
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
                  Chunk Enhancement
                </Card.Title>
                <Card.Body>
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Chunk enhancement helps extract key information. Choose a provider and model for enhancing document chunks.
                    </p>
                  </div>

                  {/* Index Method Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Index Method
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <OptionCard
                        title="High Quality"
                        description="Add Summarization for each chunk/document to extract key information. This helps improve the quality of the retrieved documents."
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 011.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                        }
                        isSelected={watchEnhancementEnabled}
                        onClick={() => setValue('enhancementEnabled', true)}
                        badge={{
                          text: "Recommended",
                          color: "primary"
                        }}
                        iconBgColor="bg-orange-100"
                        iconDarkBgColor="dark:bg-orange-800/30"
                      />

                      <OptionCard
                        title="Economical"
                        description="Non-enhanced documents are processed using the embedding model, which is more economical."
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
                            Summarization Provider/Model Configuration
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
                                  placeholder="Select a provider configuration"
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
                                  placeholder="Select a model"
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
                            Select the summarization provider configuration and model to use for this knowledge base.
                          </p>
                        </div>

                        <div className="col-span-12 sm:col-span-6">
                          <label htmlFor="summarizer_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Summarizer Type
                          </label>
                          <div className="mt-2">
                            <Controller
                              name="summarizer_type"
                              control={control}
                              render={({ field }) => (
                                <ComboboxComponent
                                  items={[
                                    { id: 'standard', label: 'Standard' },
                                    { id: 'context_aware', label: 'Context Aware' }
                                  ]}
                                  value={field.value || 'standard'}
                                  onChange={field.onChange}
                                  placeholder="Select summarizer type"
                                  disabled={!watchEnhancementEnabled}
                                />
                              )}
                            />
                          </div>
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Choose between standard and context-aware summarization.
                          </p>
                        </div>

                        {/* Temperature Slider */}
                        <div className="col-span-12 sm:col-span-6">
                          <Controller
                            name="summarizer_temperature"
                            control={control}
                            render={({ field }) => {
                              const selectedModel = selectedSummarizationProviderConfig?.available_llm_models.find(
                                (model) => model.uuid === watchSummarizationModelId
                              );

                              // If min_temperature or max_temperature is null, the model handles temperature internally
                              const isTemperatureConfigurable = selectedModel?.min_temperature !== null && selectedModel?.max_temperature !== null;

                              if (!watchEnhancementEnabled || !watchSummarizationModelId || !selectedModel || !isTemperatureConfigurable) {
                                return (
                                  <div className="opacity-50">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      Temperature
                                    </label>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {!isTemperatureConfigurable && selectedModel
                                        ? "Temperature is handled internally by this model"
                                        : "Select a model to configure temperature"
                                      }
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <Slider
                                  label="Temperature"
                                  value={field.value !== undefined && field.value !== null ? field.value : (selectedModel?.default_temperature ?? 0.7)}
                                  onChange={field.onChange}
                                  min={selectedModel.min_temperature!}
                                  max={selectedModel.max_temperature!}
                                  step={0.1}
                                  formatValue={(val) => val.toFixed(1)}
                                  description="Controls randomness in the model's output. Lower values make the output more focused and deterministic, higher values make it more random and creative."
                                />
                              );
                            }}
                          />
                        </div>
                      </div>

                      {watchSummarizerType === 'context_aware' && (
                        <div className="grid grid-cols-12 gap-6 mt-6">
                          <div className="col-span-12">
                            <div className="flex justify-between items-center">
                              <label htmlFor="summarizer_context" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Summarizer Context
                              </label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEnhanceModalOpen(true)}
                                disabled={!watchSummarizationProviderConfig || !watchSummarizationModelId}
                              >
                                Enhance
                              </Button>
                            </div>
                            <div className="mt-2">
                              <textarea
                                id="summarizer_context"
                                {...register('summarizer_context')}
                                rows={4}
                                className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md ${errors.summarizer_context ? 'border-red-500' : ''}`}
                                placeholder="Provide context for the summarizer, e.g., 'This knowledge base will be used to answer customer support questions about our products.'"
                              />
                              {errors.summarizer_context && (
                                <p className="mt-1 text-sm text-red-600">{errors.summarizer_context.message}</p>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                              Provide instructions or context to guide the summarization process. This is required for context-aware summarization.
                            </p>
                          </div>
                        </div>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loading size="sm" />
                      <span className="ml-2">Creating...</span>
                    </>
                  ) : (
                    'Create Knowledge Base'
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
      <EnhanceContextModal
        isOpen={isEnhanceModalOpen}
        onClose={() => setIsEnhanceModalOpen(false)}
        onEnhance={(enhancedText) => {
          setValue('summarizer_context', enhancedText, { shouldValidate: true });
        }}
        initialContext={watchSummarizerContext || ''}
        providerConfigId={watchSummarizationProviderConfig || ''}
        modelId={watchSummarizationModelId || ''}
        temperature={watchSummarizerTemperature || 0.7}
      />
    </div>
  );
};

export default KnowledgeBaseNewPage;
