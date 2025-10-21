import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  KnowledgeBaseFormData,
  KnowledgeBaseDetail,
  SummarizerType,
} from '../../../types/knowledge';
import toast from 'react-hot-toast';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import Card from '../../../components/shared/Card';
import { useSettings } from '../../../contexts/SettingsProvider';
import { useTranslation } from 'react-i18next';

// Create validation schema for form - translations will be applied at runtime
const createSchema = (t: any) =>
  yup
    .object({
      title: yup.string().required(t('settings.knowledgeBase.form.basicInfo.nameRequired')),
      description: yup
        .string()
        .required(t('settings.knowledgeBase.form.basicInfo.descriptionRequired')),
    })
    .required();

const KnowledgeBaseEditPage: React.FC = () => {
  const { t } = useTranslation();
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDetail | null>(null);
  const { settings } = useSettings();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<KnowledgeBaseFormData>({
    resolver: yupResolver(createSchema(t) as any),
  });

  useEffect(() => {
    if (!knowledgeBaseId) {
      navigate('/dashboard/knowledge-base');
    }
    knowledgeBaseApi
      .get(knowledgeBaseId as string)
      .then(response => {
        setItems([
          { label: t('common.dashboard'), href: '/dashboard' },
          { label: t('settings.knowledgeBase.title'), href: '/dashboard/knowledge-base' },
          { label: response.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}` },
          {
            label: t('common.edit'),
            href: `/dashboard/knowledge-base/${knowledgeBaseId}/edit`,
            current: true,
          },
        ]);
      })
      .catch(() => {
        toast.error(t('settings.knowledgeBase.toast.loadError'));
        navigate('/dashboard/knowledge-base');
      });
  }, [knowledgeBaseId, navigate, setItems, t]);

  useEffect(() => {
    const fetchKnowledgeBase = async () => {
      try {
        setIsLoading(true);
        const response = await knowledgeBaseApi.get(knowledgeBaseId as string);
        setKnowledgeBase(response);

        // Set form default values for editable fields only
        reset({
          title: response.title,
          description: response.description,
        } as any);
      } catch (error) {
        console.error('Failed to fetch knowledge base:', error);
        toast.error(t('settings.knowledgeBase.toast.loadError'));
        navigate('/dashboard/knowledge-base');
      } finally {
        setIsLoading(false);
      }
    };

    if (knowledgeBaseId) {
      fetchKnowledgeBase();
    }
  }, [knowledgeBaseId, reset, navigate, t]);

  const onSubmit = async (data: KnowledgeBaseFormData) => {
    setIsSubmitting(true);
    try {
      // In actual implementation, we would call an API to update the knowledge base
      // const response = await knowledgeBaseApi.update(knowledgeBaseId, data);
      console.log('Updating knowledge base with data:', data);

      // Mock the API call
      setTimeout(() => {
        toast.success(t('settings.knowledgeBase.toast.updateSuccess'));
        // Redirect back to the knowledge base detail page
        navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
      }, 1000);
    } catch (error) {
      console.error('Failed to update knowledge base:', error);
      toast.error(t('settings.knowledgeBase.toast.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/4 rounded bg-muted"></div>
          <div className="mb-8 h-4 w-1/2 rounded bg-muted"></div>
          <div className="space-y-6">
            <div>
              <div className="mb-2 h-4 w-1/6 rounded bg-muted"></div>
              <div className="h-10 w-full rounded bg-muted"></div>
            </div>
            <div>
              <div className="mb-2 h-4 w-1/6 rounded bg-muted"></div>
              <div className="h-24 w-full rounded bg-muted"></div>
            </div>
            <div>
              <div className="mb-2 h-4 w-1/6 rounded bg-muted"></div>
              <div className="h-10 w-full rounded bg-muted"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {t('settings.knowledgeBase.form.editTitle')}
        </h1>
        <p className="mt-2 text-sm text-foreground">{t('settings.knowledgeBase.form.subtitle')}</p>
      </div>

      <div className="mt-8 max-w-4xl">
        <div className="space-y-8">
          {/* Editable Basic Information Section */}
          <Card>
            <Card.Title
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            >
              {t('settings.knowledgeBase.form.basicInfo.title')}
            </Card.Title>
            <Card.Body>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-foreground">
                    {t('settings.knowledgeBase.form.basicInfo.name')}
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="title"
                      {...register('title')}
                      className={`block w-full rounded-md border-input-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${errors.title ? 'border-error' : ''}`}
                      placeholder={t('settings.knowledgeBase.form.basicInfo.namePlaceholder')}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-error">{errors.title.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-foreground"
                  >
                    {t('settings.knowledgeBase.form.basicInfo.description')}
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      rows={3}
                      {...register('description')}
                      className={`block w-full rounded-md border-input-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${errors.description ? 'border-error' : ''}`}
                      placeholder={t(
                        'settings.knowledgeBase.form.basicInfo.descriptionPlaceholder'
                      )}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-error">{errors.description.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`)}
                    className="rounded-md border border-input-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    {t('settings.knowledgeBase.form.submit.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting
                      ? t('settings.knowledgeBase.form.submit.updating')
                      : t('settings.knowledgeBase.form.submit.update')}
                  </button>
                </div>
              </form>
            </Card.Body>
          </Card>

          {/* Readonly Technical Configuration Section */}
          {knowledgeBase && (
            <>
              {/* Metadata (Readonly) */}
              <Card>
                <Card.Title
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-primary-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                >
                  {t('settings.knowledgeBase.readonly.knowledgeBaseInfo')}
                  <span className="ms-2 inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                    {t('settings.knowledgeBase.readonly.badge')}
                  </span>
                </Card.Title>
                <Card.Body>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        {t('settings.knowledgeBase.readonly.knowledgeBaseId')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={knowledgeBase.uuid}
                          readOnly
                          className="block w-full cursor-not-allowed rounded-md border-input-border bg-muted font-mono text-xs shadow-sm sm:text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        {t('settings.knowledgeBase.readonly.status')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={
                            knowledgeBase.status.charAt(0).toUpperCase() +
                            knowledgeBase.status.slice(1)
                          }
                          readOnly
                          className="block w-full cursor-not-allowed rounded-md border-input-border bg-muted shadow-sm sm:text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        {t('settings.knowledgeBase.readonly.createdAt')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={new Date(knowledgeBase.created_at).toLocaleString()}
                          readOnly
                          className="block w-full cursor-not-allowed rounded-md border-input-border bg-muted shadow-sm sm:text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        {t('settings.knowledgeBase.readonly.lastUpdated')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={new Date(knowledgeBase.updated_at).toLocaleString()}
                          readOnly
                          className="block w-full cursor-not-allowed rounded-md border-input-border bg-muted shadow-sm sm:text-sm"
                        />
                      </div>
                    </div>
                    {settings?.is_enterprise_mode_active && (
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          {t('settings.knowledgeBase.readonly.processingCost')}
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            value={knowledgeBase.knowledge_base_each_document_cost}
                            readOnly
                            className="block w-full cursor-not-allowed rounded-md border-input-border bg-muted shadow-sm sm:text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
              {/* Embedding Configuration (Readonly) */}
              <Card>
                <Card.Title
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-primary-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  }
                >
                  {t('settings.knowledgeBase.form.embedding.title')}
                  <span className="ms-2 inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                    {t('settings.knowledgeBase.readonly.badge')}
                  </span>
                </Card.Title>
                <Card.Body>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        {t('settings.knowledgeBase.readonly.embeddingProvider')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={
                            knowledgeBase.embedding_provider_config?.title ||
                            t('settings.knowledgeBase.readonly.notConfigured')
                          }
                          readOnly
                          className="block w-full cursor-not-allowed rounded-md border-input-border bg-muted shadow-sm sm:text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        {t('settings.knowledgeBase.readonly.embeddingModel')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={
                            knowledgeBase.embedding_model?.name ||
                            t('settings.knowledgeBase.readonly.notConfigured')
                          }
                          readOnly
                          className="block w-full cursor-not-allowed rounded-md border-input-border bg-muted shadow-sm sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Chunking Configuration (Readonly) */}
              <Card>
                <Card.Title
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-primary-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                    </svg>
                  }
                >
                  {t('settings.knowledgeBase.form.chunking.title')}
                  <span className="ms-2 inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                    {t('settings.knowledgeBase.readonly.badge')}
                  </span>
                </Card.Title>
                <Card.Body>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        {t('settings.knowledgeBase.form.chunking.chunkSize')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={`${knowledgeBase.chunk_size} ${t('settings.knowledgeBase.readonly.characters')}`}
                          readOnly
                          className="block w-full cursor-not-allowed rounded-md border-input-border bg-muted shadow-sm sm:text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        {t('settings.knowledgeBase.form.chunking.chunkOverlap')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={`${knowledgeBase.chunk_overlap} ${t('settings.knowledgeBase.readonly.characters')}`}
                          readOnly
                          className="block w-full cursor-not-allowed rounded-md border-input-border bg-muted shadow-sm sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Summarization Configuration (Readonly) */}
              <Card>
                <Card.Title
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-primary-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                >
                  {t('settings.knowledgeBase.form.summarization.title')}
                  <span className="ms-2 inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                    {t('settings.knowledgeBase.readonly.badge')}
                  </span>
                </Card.Title>
                <Card.Body>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        {t('settings.knowledgeBase.readonly.summarizationProvider')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={
                            knowledgeBase.summarization_provider_config?.title ||
                            t('settings.knowledgeBase.readonly.notConfigured')
                          }
                          readOnly
                          className="block w-full cursor-not-allowed rounded-md border-input-border bg-muted shadow-sm sm:text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        {t('settings.knowledgeBase.readonly.summarizationModel')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={
                            knowledgeBase.summarization_model?.name ||
                            t('settings.knowledgeBase.readonly.notConfigured')
                          }
                          readOnly
                          className="block w-full cursor-not-allowed rounded-md border-input-border bg-muted shadow-sm sm:text-sm"
                        />
                      </div>
                    </div>
                    {knowledgeBase.summarization_provider_config && (
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          {t('settings.knowledgeBase.readonly.summarizerType')}
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            value={
                              knowledgeBase.summarizer_type === SummarizerType.ContextAware
                                ? t('settings.knowledgeBase.form.summarization.typeContextAware')
                                : t('settings.knowledgeBase.form.summarization.typeStandard')
                            }
                            readOnly
                            className="block w-full cursor-not-allowed rounded-md border-input-border bg-muted shadow-sm sm:text-sm"
                          />
                        </div>
                      </div>
                    )}
                    {knowledgeBase.summarizer_type === SummarizerType.ContextAware && (
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          {t('settings.knowledgeBase.readonly.contextSize')}
                        </label>
                        <div className="mt-1">
                          <textarea
                            value={knowledgeBase.summarizer_context}
                            readOnly
                            className="block w-full cursor-not-allowed rounded-md border-input-border bg-muted shadow-sm sm:text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseEditPage;
