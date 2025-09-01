import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { KnowledgeBase, KnowledgeBaseDocument as Document, KnowledgeBaseChunk as Chunk, DocumentStatus } from '../../../types/knowledge';
import { PaginatedResponse } from '../../../types/common';
import { Pagination } from '../../../components/shared/Pagination';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import Loading from '../../../components/shared/Loading';
import Card from '../../../components/shared/Card';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { TrashIcon, ClipboardDocumentIcon, ChevronDownIcon, ChevronUpIcon, EyeIcon } from '@heroicons/react/24/outline';
import Modal from '../../../components/shared/Modal';
import MarkdownRenderer from '../../../components/shared/MarkdownRenderer';

const KnowledgeBaseDocumentDetailPage: React.FC = () => {
  const { knowledgeBaseId, documentId } = useParams<{ knowledgeBaseId: string; documentId: string }>();
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
      toast.error('Failed to load knowledge base details.');
    }
  }, [knowledgeBaseId]);

  const fetchDocument = useCallback(async () => {
    if (!knowledgeBaseId || !documentId) return;
    try {
      const docResponse = await knowledgeBaseApi.getDocument(knowledgeBaseId, documentId);
      setDocument(docResponse);
    } catch (error) {
      console.error('Failed to fetch document details:', error);
      toast.error('Failed to load document details.');
      navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
    }
  }, [knowledgeBaseId, documentId, navigate]);

  const fetchChunks = useCallback(async (page: number) => {
    if (!knowledgeBaseId || !documentId) return;
    setIsLoading(true);
    try {
      const chunksResponse = await knowledgeBaseApi.getDocumentChunks(knowledgeBaseId, documentId, page);
      setChunks(chunksResponse);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch chunks:', error);
      toast.error('Failed to load chunks.');
    } finally {
      setIsLoading(false);
    }
  }, [knowledgeBaseId, documentId]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchKnowledgeBase(), fetchDocument()]).finally(() => setIsLoading(false));
  }, [fetchKnowledgeBase, fetchDocument]);

  useEffect(() => {
    if (document) {
      const isProcessing = document.status !== DocumentStatus.Ready && document.status !== DocumentStatus.Failed;
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
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Knowledge Bases', href: '/dashboard/knowledge-base' },
      { label: knowledgeBase?.title || '...', href: `/dashboard/knowledge-base/${knowledgeBaseId}` },
      { label: document?.title || '...', current: true },
    ]);
  }, [knowledgeBase, document, setItems, knowledgeBaseId]);

  const handleDeleteDocument = async () => {
    if (!knowledgeBaseId || !documentId) return;

    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      setIsDeleting(true);
      toast.loading('Deleting document...');
      try {
        await knowledgeBaseApi.deleteDocument(knowledgeBaseId, documentId);
        toast.dismiss();
        toast.success('Document deleted successfully.');
        navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
      } catch (error) {
        toast.dismiss();
        console.error('Failed to delete document:', error);
        toast.error('Failed to delete document.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Chunk content copied to clipboard.');
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
    return <div className="flex justify-center items-center h-64"><Loading size="lg" /></div>;
  }

  if (!document) {
    return (
      <div className="text-center py-10">
        <p>Document not found.</p>
        <Link to={`/dashboard/knowledge-base/${knowledgeBaseId}`} className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
          Back to Knowledge Base
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Card>
        <div className="p-6">
          <div className="md:flex md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{document.title}</h2>
              <div className="flex items-center gap-x-4 mt-2">
                                {document.source && (
                                    <a href={document.source} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 dark:text-primary-400 hover:underline truncate max-w-xl block">
                    {document.source}
                  </a>
                )}
                <StatusBadge status={document.status} showIcon={true} />
              </div>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button type="button" onClick={handleDeleteDocument} disabled={isDeleting} className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50">
                <TrashIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-8">
        {document.status === DocumentStatus.Ready ? (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Document Chunks ({chunks?.count || 0})</h3>
            {isLoading && (!chunks || chunks.results.length === 0) ? (
              <div className="flex justify-center items-center h-40"><Loading size="md" /></div>
            ) : chunks && chunks.results.length > 0 ? (
              <div className="space-y-4">
                {chunks.results.map((chunk, index) => {
                  const isExpanded = expandedChunks.has(chunk.uuid);
                  const hasMore = chunk.content.split('\n').length > 3;

                  return (
                    <Card key={chunk.uuid}>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200">Chunk {(currentPage - 1) * 10 + index + 1}</h4>
                          <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-500 dark:text-gray-400">{chunk.content.length} characters</span>
                              <button
                                  onClick={() => {
                                      setPreviewContent(chunk.content);
                                      setShowPreviewModal(true);
                                  }}
                                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                  title="Preview content"
                              >
                                  <EyeIcon className="h-5 w-5" />
                              </button>
                              <button onClick={() => handleCopy(chunk.content)} className="text-gray-400 hover:text-primary-500" title="Copy content">
                                  <ClipboardDocumentIcon className="h-5 w-5" />
                              </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                          <p>{isExpanded ? chunk.content : getTruncatedContent(chunk.content)}</p>
                          {hasMore && (
                            <button onClick={() => toggleChunkExpansion(chunk.uuid)} className="text-primary-600 dark:text-primary-400 hover:underline text-sm mt-2 inline-flex items-center">
                              {isExpanded ? 'Show less' : 'Show more'}
                              {isExpanded ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />}
                            </button>
                          )}
                        </div>
                        {chunk.keywords && chunk.keywords.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Keywords</h5>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {chunk.keywords.map((keyword: string, i: number) => (
                                <span key={i} className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-700 bg-primary-100 rounded-full dark:bg-primary-900 dark:text-primary-300">
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
              <Card><div className="text-center py-10"><p>No chunks found for this document.</p></div></Card>
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
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Processing Failed</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">The document could not be processed. Error details:</p>
                            <pre className="mt-4 text-left bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap"><code>{document.error || 'No error details available.'}</code></pre>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="p-6 text-center">
              <div className="flex justify-center items-center mb-4">
                <Loading size="md" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Document is being processed...</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">The content is being chunked and indexed. This may take a few moments. The page will refresh automatically.</p>
            </div>
          </Card>
        )}
      </div>

      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Chunk Content Preview"
        size="80vw"
      >
        <div className="mt-4">
          <MarkdownRenderer content={previewContent} />
        </div>
      </Modal>
    </div>
  );
};

export default KnowledgeBaseDocumentDetailPage;
