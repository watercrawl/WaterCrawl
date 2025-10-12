import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { PlusIcon, PencilSquareIcon, TrashIcon, ExclamationTriangleIcon, ArrowPathIcon, BeakerIcon, EyeIcon } from '@heroicons/react/24/outline';
import Modal from '../../../components/shared/Modal';
import toast from 'react-hot-toast';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { DocumentStatus, KnowledgeBaseDetail, KnowledgeBaseDocument } from '../../../types/knowledge';
import { PaginatedResponse } from '../../../types/common';
import { Pagination } from '../../../components/shared/Pagination';
import Loading from '../../../components/shared/Loading';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useTeam } from '../../../contexts/TeamContext';
import UsageLimitBox from '../../../components/shared/UsageLimitBox';
import { useSettings } from '../../../contexts/SettingsProvider';
import { useDateLocale } from '../../../hooks/useDateLocale';
import { formatDistanceToNowLocalized } from '../../../utils/dateUtils';
import { useTranslation } from 'react-i18next';

const KnowledgeBaseDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const { currentSubscription } = useTeam();
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDetail | null>(null);
  const [documents, setDocuments] = useState<PaginatedResponse<KnowledgeBaseDocument> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { settings } = useSettings();

  const handleDeleteKnowledgeBase = async () => {
    if (!knowledgeBase || deleteConfirmation !== knowledgeBase.title) {
      toast.error(t('settings.knowledgeBase.delete.confirmError'));
      return;
    }

    setIsDeleting(true);
    try {
      await knowledgeBaseApi.delete(knowledgeBase.uuid);
      toast.success(t('settings.knowledgeBase.toast.deleteSuccess'));
      navigate('/dashboard/knowledge-base');
    } catch (error) {
      console.error('Failed to delete knowledge base:', error);
      toast.error(t('settings.knowledgeBase.toast.deleteError'));
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmation('');
    }
  };

  useEffect(() => {
    if (!knowledgeBase) return;
    setItems([
      { label: t('common.dashboard'), href: '/dashboard' },
      { label: t('settings.knowledgeBase.title'), href: '/dashboard/knowledge-base' },
      { label: knowledgeBase.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}`, current: true },
    ]);
  }, [knowledgeBase, setItems, knowledgeBaseId, t]);

  const fetchDocuments = useCallback(async (page: number, controlledRefresh = false) => {
    if (!knowledgeBaseId) return;
    if (!controlledRefresh) setIsLoadingDocuments(true);
    try {
      const response = await knowledgeBaseApi.getDocuments(knowledgeBaseId, page);
      setDocuments(response);
      const isProcessing = response.results.some((doc: KnowledgeBaseDocument) =>
        [DocumentStatus.Crawling, DocumentStatus.Processing].includes(doc.status)
      );
      setAutoRefresh(isProcessing);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error(t('settings.knowledgeBase.documents.loadError'));
    } finally {
      if (!controlledRefresh) setIsLoadingDocuments(false);
    }
  }, [knowledgeBaseId, t]);

  const fetchKnowledgeBase = useCallback(async () => {
    if (!knowledgeBaseId) return;
    setIsLoading(true);
    try {
      const response = await knowledgeBaseApi.get(knowledgeBaseId);
      setKnowledgeBase(response);
    } catch (_error) {
      toast.error(t('settings.knowledgeBase.toast.loadError'));
      navigate('/dashboard/knowledge-base');
    } finally {
      setIsLoading(false);
    }
  }, [knowledgeBaseId, navigate, t]);

  useEffect(() => {
    if (!knowledgeBaseId) return;
    fetchKnowledgeBase();
  }, [knowledgeBaseId, fetchKnowledgeBase]);

  // Fetch documents when the page loads or when the current page changes
  useEffect(() => {
    if (!knowledgeBaseId) return;
    fetchDocuments(currentPage);
  }, [knowledgeBaseId, currentPage, fetchDocuments]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => fetchDocuments(currentPage, true), 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, currentPage, fetchDocuments]);

  const handleRetryIndexing = async (documentUuid: string) => {
    if (!knowledgeBaseId) return;
    setIsRetrying(true);
    toast.loading(t('settings.knowledgeBase.documents.retryingIndexing'));
    try {
      await knowledgeBaseApi.retry_indexing(knowledgeBaseId, documentUuid);
      toast.dismiss();
      toast.success(t('settings.knowledgeBase.documents.retrySuccess'));
      await fetchDocuments(currentPage);
    } catch (error) {
      toast.dismiss();
      console.error('Failed to retry indexing:', error);
      toast.error(t('settings.knowledgeBase.documents.retryError'));
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!knowledgeBaseId) return;
    setIsDeleting(true);
    try {
      await knowledgeBaseApi.deleteDocument(knowledgeBaseId, documentId);
      setDocuments(prevDocs => {
        if (!prevDocs) return null;
        return {
          ...prevDocs,
          results: prevDocs.results.filter(doc => doc.uuid !== documentId),
        };
      });
      toast.success(t('settings.knowledgeBase.documents.deleteSuccess'));
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast.error(t('settings.knowledgeBase.documents.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const renderLoadingState = () => {
    return (
      <div className="text-center py-8">
        <Loading size="md" />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('settings.knowledgeBase.documents.loading')}</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!knowledgeBase) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('settings.knowledgeBase.detail.notFound')}
          </p>
          <div className="mt-4">
            <Link
              to="/dashboard/knowledge-base"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {t('settings.knowledgeBase.detail.goBack')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {knowledgeBase?.status === 'archived' && (
        <div className="mb-4 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/10">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ms-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">{t('settings.knowledgeBase.detail.archivedTitle')}</h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
                <p>{t('settings.knowledgeBase.detail.archivedMessage')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="sm:flex sm:items-center sm:justify-between mb-4">
        <div className="sm:flex-auto">
          <div className="flex items-center mb-2">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{knowledgeBase?.title}</h1>
            <Link to={`/dashboard/knowledge-base/${knowledgeBase?.uuid}/edit`} className="ms-4 text-primary-600 hover:text-primary-700">
              <PencilSquareIcon className="h-5 w-5" />
            </Link>
          </div>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{knowledgeBase?.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            {settings?.is_enterprise_mode_active && (
              <span>{t('settings.knowledgeBase.detail.costPerDocument')}: {knowledgeBase?.knowledge_base_each_document_cost}</span>
            )}
            <span>{t('settings.knowledgeBase.detail.created')}: {formatDistanceToNowLocalized(new Date(knowledgeBase?.created_at), dateLocale)}</span>

            {/* Compact Document Usage moved to actions area for better layout */}
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col items-stretch sm:items-end gap-2">
          {currentSubscription && knowledgeBase && (
            <UsageLimitBox
              label={t('settings.knowledgeBase.detail.documents')}
              current={knowledgeBase.document_count}
              limit={currentSubscription.number_of_each_knowledge_base_documents}
            />
          )}
          <div className="flex gap-x-3">
          <Link
            to={`/dashboard/knowledge-base/${knowledgeBaseId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PencilSquareIcon className="-ms-1 me-2 h-5 w-5" aria-hidden="true" />
            {t('common.edit')}
          </Link>
          <Link
            to={`/dashboard/knowledge-base/${knowledgeBaseId}/query`}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <BeakerIcon className="-ms-1 me-2 h-5 w-5" aria-hidden="true" />
            {t('settings.knowledgeBase.detail.test')}
          </Link>
          {knowledgeBase?.status === 'active' && (
            <Link
              to={`/dashboard/knowledge-base/${knowledgeBaseId}/import`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="-ms-1 me-2 h-5 w-5" aria-hidden="true" />
              {t('settings.knowledgeBase.detail.addDocument')}
            </Link>
          )}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-700 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="-ms-1 me-2 h-5 w-5" aria-hidden="true" />
            {t('common.delete')}
          </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('settings.knowledgeBase.detail.documents')}</h2>
        <div>
          <div className="mt-4">
            {isLoadingDocuments ? (
              renderLoadingState()
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 ps-4 pe-3 text-start text-sm font-semibold text-gray-900 dark:text-gray-200 sm:ps-6"
                      >
                        {t('settings.knowledgeBase.documents.title')}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-gray-200"
                      >
                        {t('settings.knowledgeBase.documents.source')}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-gray-200"
                      >
                        {t('settings.knowledgeBase.documents.status')}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-gray-200"
                      >
                        {t('settings.knowledgeBase.documents.updatedAt')}
                      </th>
                      <th scope="col" className="relative py-3.5 ps-3 pe-4 sm:pe-6">
                        <span className="sr-only">{t('common.actions')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {isLoadingDocuments ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8">
                          <Loading size="md" />
                        </td>
                      </tr>
                    ) : documents && documents.results.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8">
                          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('settings.knowledgeBase.documents.noDocuments')}</h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('settings.knowledgeBase.documents.getStarted')}</p>
                        </td>
                      </tr>
                    ) : (
                      documents && documents.results.map(document => (
                        <tr key={document.uuid}>
                          <td className="whitespace-nowrap py-4 ps-4 pe-3 text-sm font-medium text-gray-900 dark:text-white sm:ps-6">
                            <Link to={`/dashboard/knowledge-base/${knowledgeBaseId}/documents/${document.uuid}`} className="hover:text-primary-600 dark:hover:text-primary-400">
                              {document.title.slice(0, 50)}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            <a
                              href={document.source || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 truncate block max-w-xs"
                            >
                              {document.source || 'N/A'}
                            </a>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <StatusBadge status={document.status} showIcon={true} />
                              {document.status === 'failed' && (
                                <>
                                  {document.error && (
                                    <span
                                      className="ms-2 text-red-500 dark:text-red-400 cursor-help"
                                      title={document.error}
                                    >
                                      ⓘ
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleRetryIndexing(document.uuid)}
                                    className="ms-2 text-primary-600 hover:text-primary-900 disabled:opacity-50"
                                    disabled={isRetrying}
                                    title="Retry indexing"
                                  >
                                    <ArrowPathIcon className={`h-5 w-5 ${isRetrying ? 'animate-spin' : ''}`} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {formatDistanceToNowLocalized(new Date(document.updated_at), dateLocale)}
                          </td>
                          <td className="relative whitespace-nowrap py-4 ps-3 pe-4 text-end text-sm font-medium sm:pe-6">
                            <div className="flex items-center justify-end gap-x-4">
                              <Link to={`/dashboard/knowledge-base/${knowledgeBaseId}/documents/${document.uuid}`} className="text-gray-400 hover:text-primary-500" title="View Chunks">
                                <EyeIcon className="h-5 w-5" />
                              </Link>
                              <button
                                className="text-gray-400 hover:text-red-500"
                                onClick={() => handleDeleteDocument(document.uuid)}
                                disabled={isDeleting}
                                title="Delete Document"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

              </div>
            )}

            {documents && documents.count > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={documents.count}
                hasNextPage={!!documents.next}
                hasPreviousPage={!!documents.previous}
                onPageChange={setCurrentPage}
                loading={isLoadingDocuments}
              />
            )}
          </div>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmation('');
        }}
        title={t('settings.knowledgeBase.delete.title')}
        size="md"
      >
        <div className="mt-4">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 me-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('settings.knowledgeBase.delete.confirmTitle')}
              </h3>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t('settings.knowledgeBase.delete.warningMessage', { title: knowledgeBase?.title })}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('settings.knowledgeBase.delete.confirmPrompt', { title: knowledgeBase?.title })}
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={knowledgeBase?.title}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white"
              disabled={isDeleting}
            />
          </div>
          
          <div className="flex gap-x-3 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmation('');
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isDeleting}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleDeleteKnowledgeBase}
              disabled={isDeleting || deleteConfirmation !== knowledgeBase?.title}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isDeleting ? (
                <>
                  <Loading size="sm" />
                  <span className="ms-2">{t('settings.knowledgeBase.delete.deleting')}</span>
                </>
              ) : (
                t('settings.knowledgeBase.delete.confirm')
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default KnowledgeBaseDetailPage;
