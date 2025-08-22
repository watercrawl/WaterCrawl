import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { KnowledgeBaseFormData, KnowledgeBaseDetail, SummarizerType } from '../../../types/knowledge';
import toast from 'react-hot-toast';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import Card from '../../../components/shared/Card';
import { useSettings } from '../../../contexts/SettingsProvider';

// Create validation schema for form
const schema = yup.object({
  title: yup.string().required('Name is required'),
  description: yup.string().required('Description is required'),
}).required();

const KnowledgeBaseEditPage: React.FC = () => {
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDetail | null>(null);
  const { settings } = useSettings();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<KnowledgeBaseFormData>({
    resolver: yupResolver(schema as any)
  });

  useEffect(() => {
    if (!knowledgeBaseId) {
      navigate('/dashboard/knowledge-base');
    }
    knowledgeBaseApi.get(knowledgeBaseId as string).then((response) => {
      setItems([
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Knowledge Bases', href: '/dashboard/knowledge-base' },
        { label: response.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}` },
        { label: 'Edit', href: `/dashboard/knowledge-base/${knowledgeBaseId}/edit`, current: true },
      ]);
    }).catch(() => {
      toast.error('Failed to load knowledge base');
      navigate('/dashboard/knowledge-base');
    });
  }, [knowledgeBaseId, navigate, setItems]);

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
        toast.error('Failed to load knowledge base data');
        navigate('/dashboard/knowledge-base');
      } finally {
        setIsLoading(false);
      }
    };

    if (knowledgeBaseId) {
      fetchKnowledgeBase();
    }
  }, [knowledgeBaseId, reset, navigate]);


  const onSubmit = async (data: KnowledgeBaseFormData) => {
    setIsSubmitting(true);
    try {
      // In actual implementation, we would call an API to update the knowledge base
      // const response = await knowledgeBaseApi.update(knowledgeBaseId, data);
      console.log('Updating knowledge base with data:', data);

      // Mock the API call
      setTimeout(() => {
        toast.success('Knowledge base updated successfully');
        // Redirect back to the knowledge base detail page
        navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
      }, 1000);
    } catch (error) {
      console.error('Failed to update knowledge base:', error);
      toast.error('Failed to update knowledge base');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="space-y-6">
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6 mb-2"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6 mb-2"></div>
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6 mb-2"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Knowledge Base</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Update your knowledge base details.
        </p>
      </div>

      <div className="mt-8 max-w-4xl">
        <div className="space-y-8">
          {/* Editable Basic Information Section */}
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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="title"
                      {...register('title')}
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md ${errors.title ? 'border-red-500' : ''}`}
                      placeholder="e.g., Product Documentation"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      rows={3}
                      {...register('description')}
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md ${errors.description ? 'border-red-500' : ''}`}
                      placeholder="e.g., This knowledge base contains our product documentation"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4z" clipRule="evenodd" />
                    </svg>
                  }
                >
                  Knowledge Base Information
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    Read-only
                  </span>
                </Card.Title>
                <Card.Body>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Knowledge Base ID
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={knowledgeBase.uuid}
                          readOnly
                          className="shadow-sm block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md bg-gray-50 dark:bg-gray-900 cursor-not-allowed font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={knowledgeBase.status.charAt(0).toUpperCase() + knowledgeBase.status.slice(1)}
                          readOnly
                          className="shadow-sm block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Created At
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={new Date(knowledgeBase.created_at).toLocaleString()}
                          readOnly
                          className="shadow-sm block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Last Updated
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={new Date(knowledgeBase.updated_at).toLocaleString()}
                          readOnly
                          className="shadow-sm block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    {settings?.is_enterprise_mode_active && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Processing Cost Per Document
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            value={knowledgeBase.knowledge_base_each_document_cost}
                            readOnly
                            className="shadow-sm block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  }
                >
                  Embedding Configuration
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    Read-only
                  </span>
                </Card.Title>
                <Card.Body>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Embedding Provider
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={knowledgeBase.embedding_provider_config?.title || 'Not configured'}
                          readOnly
                          className="shadow-sm block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Embedding Model
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={knowledgeBase.embedding_model?.name || 'Not configured'}
                          readOnly
                          className="shadow-sm block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                    </svg>
                  }
                >
                  Chunking Configuration
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    Read-only
                  </span>
                </Card.Title>
                <Card.Body>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Chunk Size
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={`${knowledgeBase.chunk_size} characters`}
                          readOnly
                          className="shadow-sm block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Chunk Overlap
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={`${knowledgeBase.chunk_overlap} characters`}
                          readOnly
                          className="shadow-sm block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  }
                >
                  Summarization Configuration
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    Read-only
                  </span>
                </Card.Title>
                <Card.Body>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Summarization Provider
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={knowledgeBase.summarization_provider_config?.title || 'Not configured'}
                          readOnly
                          className="shadow-sm block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Summarization Model
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={knowledgeBase.summarization_model?.name || 'Not configured'}
                          readOnly
                          className="shadow-sm block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    {knowledgeBase.summarization_provider_config && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Summarizer Type
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            value={knowledgeBase.summarizer_type === SummarizerType.ContextAware ? 'Context Aware' : 'Standard'}
                            readOnly
                            className="shadow-sm block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    )}
                    {knowledgeBase.summarizer_type === SummarizerType.ContextAware && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Context Size
                        </label>
                        <div className="mt-1">
                          <textarea
                            value={knowledgeBase.summarizer_context}
                            readOnly
                            className="shadow-sm block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
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
