import React, { useEffect, useState, useCallback } from 'react';

import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';

import {
  TrashIcon,
  ClipboardDocumentIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

import Card from '../../../components/shared/Card';
import Loading from '../../../components/shared/Loading';
import MarkdownRenderer from '../../../components/shared/MarkdownRenderer';
import Modal from '../../../components/shared/Modal';
import { Pagination } from '../../../components/shared/Pagination';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { PaginatedResponse } from '../../../types/common';
import {
  KnowledgeBase,
  KnowledgeBaseDocument as Document,
  KnowledgeBaseChunk as Chunk,
  DocumentStatus,
} from '../../../types/knowledge';

const KnowledgeBaseDocumentDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const { knowledgeBaseId, documentId } = useParams<{
    knowledgeBaseId: string;
    documentId: string;
  }>();
  const { setItems } = useBreadcrumbs();
  const navigate = useNavigate();

  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [chunks, setChunks] = useState<PaginatedResponse<Chunk> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const fetchKnowledgeBase = useCallback(async () => {
    if (!knowledgeBaseId) return;
    try {
      const kb = await knowledgeBaseApi.get(knowledgeBaseId);
      setKnowledgeBase(kb);
    } catch (error) {
      console.error('Failed to fetch knowledge base:', error);
      toast.error(t('settings.knowledgeBase.toast.loadError'));
    }
  }, [knowledgeBaseId, t]);

  const fetchDocument = useCallback(async () => {
    if (!knowledgeBaseId || !documentId) return;
    try {
      const docResponse = await knowledgeBaseApi.getDocument(knowledgeBaseId, documentId);
      setDocument(docResponse);
    } catch (error) {
      console.error('Failed to fetch document details:', error);
      toast.error(t('settings.knowledgeBase.documentDetail.loadError'));
      navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
    }
  }, [knowledgeBaseId, documentId, navigate, t]);

  const fetchChunks = useCallback(
    async (page: number) => {
      if (!knowledgeBaseId || !documentId) return;
      setIsLoading(true);
      try {
        const chunksResponse = await knowledgeBaseApi.getDocumentChunks(
          knowledgeBaseId,
          documentId,
          page
        );
        setChunks(chunksResponse);
        setCurrentPage(page);
      } catch (error) {
        console.error('Failed to fetch chunks:', error);
        toast.error(t('settings.knowledgeBase.documentDetail.chunksLoadError'));
      } finally {
        setIsLoading(false);
      }
    },
    [knowledgeBaseId, documentId, t]
  );

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchKnowledgeBase(), fetchDocument()]).finally(() => setIsLoading(false));
  }, [fetchKnowledgeBase, fetchDocument]);

  useEffect(() => {
    if (document) {
      const isProcessing =
        document.status !== DocumentStatus.Ready && document.status !== DocumentStatus.Failed;
      setAutoRefresh(isProcessing);
      if (document.status === DocumentStatus.Ready) {
        fetchChunks(currentPage);
      }
    }
  }, [document, currentPage, fetchChunks]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchDocument();
      }, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchDocument]);

  useEffect(() => {
    setItems([
      { label: t('common.dashboard'), href: '/dashboard' },
      { label: t('settings.knowledgeBase.title'), href: '/dashboard/knowledge-base' },
      {
        label: knowledgeBase?.title || '...',
        href: `/dashboard/knowledge-base/${knowledgeBaseId}`,
      },
      { label: document?.title || '...', current: true },
    ]);
  }, [knowledgeBase, document, setItems, knowledgeBaseId, t]);

  const handleDeleteDocument = async () => {
    if (!knowledgeBaseId || !documentId) return;

    confirm({
      title: t('settings.knowledgeBase.documentDetail.deleteTitle'),
      message: t('settings.knowledgeBase.documentDetail.deleteConfirm'),
      confirmText: t('common.delete'),
      variant: 'danger',
      onConfirm: async () => {
        setIsDeleting(true);
        toast.loading(t('settings.knowledgeBase.documentDetail.deleting'));
        try {
          await knowledgeBaseApi.deleteDocument(knowledgeBaseId, documentId);
          toast.dismiss();
          toast.success(t('settings.knowledgeBase.documentDetail.deleteSuccess'));
          navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
        } catch (error) {
          toast.dismiss();
          console.error('Failed to delete document:', error);
          toast.error(t('settings.knowledgeBase.documentDetail.deleteError'));
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success(t('settings.knowledgeBase.documentDetail.copiedToClipboard'));
  };

  const toggleChunkExpansion = (chunkUuid: string) => {
    setExpandedChunks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chunkUuid)) {
        newSet.delete(chunkUuid);
      } else {
        newSet.add(chunkUuid);
      }
      return newSet;
    });
  };

  const getTruncatedContent = (content: string) => {
    return content.split('\n').slice(0, 3).join('\n');
  };

  if (isLoading && !document) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="py-10 text-center">
        <p>{t('settings.knowledgeBase.documentDetail.notFound')}</p>
        <Link
          to={`/dashboard/knowledge-base/${knowledgeBaseId}`}
          className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          {t('settings.knowledgeBase.documentDetail.backToKB')}
        </Link>
      </div>
    );
  }

  return (
    <div className="m-8">
      <Card>
        <div className="p-6">
          <div className="md:flex md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-foreground">{document.title}</h2>
              <div className="mt-2 flex items-center gap-x-4">
                {document.source && (
                  <a
                    href={document.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block max-w-xl truncate text-sm text-primary hover:underline"
                  >
                    {document.source}
                  </a>
                )}
                <StatusBadge status={document.status} showIcon={true} />
              </div>
            </div>
            <div className="mt-4 flex md:ms-4 md:mt-0">
              <button
                type="button"
                onClick={handleDeleteDocument}
                disabled={isDeleting}
                className="inline-flex items-center rounded-md bg-error px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:opacity-50"
              >
                <TrashIcon className="-ms-0.5 me-1.5 h-5 w-5" aria-hidden="true" />
                {isDeleting
                  ? t('settings.knowledgeBase.documentDetail.deleting')
                  : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-8">
        {document.status === DocumentStatus.Ready ? (
          <div>
            <h3 className="mb-4 text-xl font-semibold text-foreground">
              {t('settings.knowledgeBase.documentDetail.chunksTitle', {
                count: chunks?.count || 0,
              })}
            </h3>
            {isLoading && (!chunks || chunks.results.length === 0) ? (
              <div className="flex h-40 items-center justify-center">
                <Loading size="md" />
              </div>
            ) : chunks && chunks.results.length > 0 ? (
              <div className="space-y-4">
                {chunks.results.map((chunk, index) => {
                  const isExpanded = expandedChunks.has(chunk.uuid);
                  const hasMore = chunk.content.split('\n').length > 3;

                  return (
                    <Card key={chunk.uuid}>
                      <div className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-md font-semibold text-foreground">
                            {t('settings.knowledgeBase.documentDetail.chunkNumber', {
                              number: (currentPage - 1) * 10 + index + 1,
                            })}
                          </h4>
                          <div className="flex items-center gap-x-4">
                            <span className="text-sm text-muted-foreground">
                              {t('settings.knowledgeBase.documentDetail.characters', {
                                count: chunk.content.length,
                              })}
                            </span>
                            <button
                              onClick={() => {
                                setPreviewContent(chunk.content);
                                setShowPreviewModal(true);
                              }}
                              className="p-1 text-muted-foreground hover:text-foreground"
                              title={t('settings.knowledgeBase.documentDetail.previewContent')}
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleCopy(chunk.content)}
                              className="text-muted-foreground hover:text-primary"
                              title={t('settings.knowledgeBase.documentDetail.copyContent')}
                            >
                              <ClipboardDocumentIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        <div className="whitespace-pre-wrap rounded-md bg-muted p-4 font-sans text-sm text-muted-foreground">
                          <p>{isExpanded ? chunk.content : getTruncatedContent(chunk.content)}</p>
                          {hasMore && (
                            <button
                              onClick={() => toggleChunkExpansion(chunk.uuid)}
                              className="mt-2 inline-flex items-center text-sm text-primary hover:underline"
                            >
                              {isExpanded ? t('common.showLess') : t('common.showMore')}
                              {isExpanded ? (
                                <ChevronUpIcon className="ms-1 h-4 w-4" />
                              ) : (
                                <ChevronDownIcon className="ms-1 h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                        {chunk.keywords && chunk.keywords.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-semibold text-foreground">
                              {t('settings.knowledgeBase.documentDetail.keywords')}
                            </h5>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {chunk.keywords.map((keyword: string, i: number) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                                >
                                  #{keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <div className="py-10 text-center">
                  <p>{t('settings.knowledgeBase.documentDetail.noChunks')}</p>
                </div>
              </Card>
            )}
            {chunks && chunks.count > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={chunks.count}
                hasNextPage={!!chunks.next}
                hasPreviousPage={!!chunks.previous}
                onPageChange={fetchChunks}
                loading={isLoading}
              />
            )}
          </div>
        ) : document.status === DocumentStatus.Failed ? (
          <Card>
            <div className="p-6 text-center">
              <h3 className="text-lg font-semibold text-error">
                {t('settings.knowledgeBase.documentDetail.processingFailed')}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('settings.knowledgeBase.documentDetail.errorDetails')}
              </p>
              <pre className="mt-4 whitespace-pre-wrap rounded-md bg-muted p-4 text-start text-sm text-error">
                <code>
                  {document.error || t('settings.knowledgeBase.documentDetail.noErrorDetails')}
                </code>
              </pre>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="p-6 text-center">
              <div className="mb-4 flex items-center justify-center">
                <Loading size="md" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {t('settings.knowledgeBase.documentDetail.processing')}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('settings.knowledgeBase.documentDetail.processingMessage')}
              </p>
            </div>
          </Card>
        )}
      </div>

      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={t('settings.knowledgeBase.documentDetail.previewTitle')}
        size="6xl"
      >
        <div className="mt-4">
          <MarkdownRenderer content={previewContent} />
        </div>
      </Modal>
    </div>
  );
};

export default KnowledgeBaseDocumentDetailPage;
