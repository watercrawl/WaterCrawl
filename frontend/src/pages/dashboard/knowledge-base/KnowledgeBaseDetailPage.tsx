import React, { useState, useEffect, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useNavigate } from 'react-router-dom';

import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BeakerIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

import Loading from '../../../components/shared/Loading';
import { Pagination } from '../../../components/shared/Pagination';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import UsageLimitBox from '../../../components/shared/UsageLimitBox';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { useSettings } from '../../../contexts/SettingsProvider';
import { useTeam } from '../../../contexts/TeamContext';
import { useDateLocale } from '../../../hooks/useDateLocale';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { PaginatedResponse } from '../../../types/common';
import {
  DocumentStatus,
  KnowledgeBaseDetail,
  KnowledgeBaseDocument,
} from '../../../types/knowledge';
import { formatDistanceToNowLocalized } from '../../../utils/dateUtils';


const KnowledgeBaseDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const { settings } = useSettings();

  const handleDeleteKnowledgeBase = () => {
    if (!knowledgeBase) return;

    confirm({
      title: t('settings.knowledgeBase.delete.title'),
      message: t('settings.knowledgeBase.delete.warningMessage', { title: knowledgeBase.title }),
      warningMessage: t('settings.knowledgeBase.delete.confirmPrompt', { title: knowledgeBase.title }),
      variant: 'danger',
      requireInput: true,
      inputLabel: t('settings.knowledgeBase.delete.inputLabel'),
      inputPlaceholder: knowledgeBase.title,
      expectedInput: knowledgeBase.title,
      confirmText: t('settings.knowledgeBase.delete.confirm'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
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
        }
      },
    });
  };

  useEffect(() => {
    if (!knowledgeBase) return;
    setItems([
      { label: t('common.dashboard'), href: '/dashboard' },
      { label: t('settings.knowledgeBase.title'), href: '/dashboard/knowledge-base' },
      {
        label: knowledgeBase.title,
        href: `/dashboard/knowledge-base/${knowledgeBaseId}`,
        current: true,
      },
    ]);
  }, [knowledgeBase, setItems, knowledgeBaseId, t]);

  const fetchDocuments = useCallback(
    async (page: number, controlledRefresh = false) => {
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
    },
    [knowledgeBaseId, t]
  );

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
      <div className="py-8 text-center">
        <Loading size="md" />
        <p className="mt-2 text-sm text-muted-foreground">
          {t('settings.knowledgeBase.documents.loading')}
        </p>
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
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {t('settings.knowledgeBase.detail.notFound')}
          </p>
          <div className="mt-4">
            <Link
              to="/dashboard/knowledge-base"
              className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {t('settings.knowledgeBase.detail.goBack')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {knowledgeBase?.status === 'archived' && (
        <div className="mb-4 rounded-md bg-warning-soft p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-warning" aria-hidden="true" />
            </div>
            <div className="ms-3">
              <h3 className="text-sm font-medium text-warning-strong">
                {t('settings.knowledgeBase.detail.archivedTitle')}
              </h3>
              <div className="mt-2 text-sm text-warning-strong">
                <p>{t('settings.knowledgeBase.detail.archivedMessage')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="mb-4 sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <div className="mb-2 flex items-center">
            <h1 className="text-xl font-semibold text-foreground">{knowledgeBase?.title}</h1>
            <Link
              to={`/dashboard/knowledge-base/${knowledgeBase?.uuid}/edit`}
              className="ms-4 text-primary hover:text-primary-strong"
            >
              <PencilSquareIcon className="h-5 w-5" />
            </Link>
          </div>
          <p className="mt-2 text-sm text-foreground">{knowledgeBase?.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {settings?.is_enterprise_mode_active && (
              <span>
                {t('settings.knowledgeBase.detail.costPerDocument')}:{' '}
                {knowledgeBase?.knowledge_base_each_document_cost}
              </span>
            )}
            <span>
              {t('settings.knowledgeBase.detail.created')}:{' '}
              {formatDistanceToNowLocalized(new Date(knowledgeBase?.created_at), dateLocale)}
            </span>

            {/* Compact Document Usage moved to actions area for better layout */}
          </div>
        </div>
        <div className="mt-4 flex flex-col items-stretch gap-2 sm:mt-0 sm:items-end">
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
              className="inline-flex items-center rounded-md border border-input-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <PencilSquareIcon className="-ms-1 me-2 h-5 w-5" aria-hidden="true" />
              {t('common.edit')}
            </Link>
            <Link
              to={`/dashboard/knowledge-base/${knowledgeBaseId}/query`}
              className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <BeakerIcon className="-ms-1 me-2 h-5 w-5" aria-hidden="true" />
              {t('settings.knowledgeBase.detail.test')}
            </Link>
            {knowledgeBase?.status === 'active' && (
              <Link
                to={`/dashboard/knowledge-base/${knowledgeBaseId}/import`}
                className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <PlusIcon className="-ms-1 me-2 h-5 w-5" aria-hidden="true" />
                {t('settings.knowledgeBase.detail.addDocument')}
              </Link>
            )}
            <button
              onClick={handleDeleteKnowledgeBase}
              className="inline-flex items-center rounded-md border border-error bg-card px-4 py-2 text-sm font-medium text-error shadow-sm hover:bg-error-soft hover:text-error-strong focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2"
            >
              <TrashIcon className="-ms-1 me-2 h-5 w-5" aria-hidden="true" />
              {t('common.delete')}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-medium text-foreground">
          {t('settings.knowledgeBase.detail.documents')}
        </h2>
        <div>
          <div className="mt-4">
            {isLoadingDocuments ? (
              renderLoadingState()
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pe-3 ps-4 text-start text-sm font-semibold text-foreground sm:ps-6"
                      >
                        {t('settings.knowledgeBase.documents.title')}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                      >
                        {t('settings.knowledgeBase.documents.source')}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                      >
                        {t('settings.knowledgeBase.documents.status')}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                      >
                        {t('settings.knowledgeBase.documents.updatedAt')}
                      </th>
                      <th scope="col" className="relative py-3.5 pe-4 ps-3 sm:pe-6">
                        <span className="sr-only">{t('common.actions')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {isLoadingDocuments ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center">
                          <Loading size="md" />
                        </td>
                      </tr>
                    ) : documents && documents.results.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center">
                          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-2 text-sm font-medium text-foreground">
                            {t('settings.knowledgeBase.documents.noDocuments')}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {t('settings.knowledgeBase.documents.getStarted')}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      documents &&
                      documents.results.map(document => (
                        <tr key={document.uuid}>
                          <td className="whitespace-nowrap py-4 pe-3 ps-4 text-sm font-medium text-foreground sm:ps-6">
                            <Link
                              to={`/dashboard/knowledge-base/${knowledgeBaseId}/documents/${document.uuid}`}
                              className="hover:text-primary"
                            >
                              {document.title.slice(0, 50)}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                            <a
                              href={document.source || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block max-w-xs truncate text-primary hover:text-primary-strong"
                            >
                              {document.source || 'N/A'}
                            </a>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <StatusBadge status={document.status} showIcon={true} />
                              {document.status === 'failed' && (
                                <>
                                  {document.error && (
                                    <span
                                      className="ms-2 cursor-help text-error"
                                      title={document.error}
                                    >
                                      ⓘ
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleRetryIndexing(document.uuid)}
                                    className="ms-2 text-primary hover:text-primary-strong disabled:opacity-50"
                                    disabled={isRetrying}
                                    title="Retry indexing"
                                  >
                                    <ArrowPathIcon
                                      className={`h-5 w-5 ${isRetrying ? 'animate-spin' : ''}`}
                                    />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                            {formatDistanceToNowLocalized(
                              new Date(document.updated_at),
                              dateLocale
                            )}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pe-4 ps-3 text-end text-sm font-medium sm:pe-6">
                            <div className="flex items-center justify-end gap-x-4">
                              <Link
                                to={`/dashboard/knowledge-base/${knowledgeBaseId}/documents/${document.uuid}`}
                                className="text-muted-foreground hover:text-primary"
                                title="View Chunks"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </Link>
                              <button
                                className="text-muted-foreground hover:text-error"
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
    </div>
  );
};

export default KnowledgeBaseDetailPage;
