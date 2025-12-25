import React, { useState } from 'react';

import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  ClipboardDocumentIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

import Card from '../shared/Card';
import MarkdownRenderer from '../shared/MarkdownRenderer';
import Modal from '../shared/Modal';

interface QueryResultData {
  content: string;
  metadata: {
    index: number;
    uuid: string;
    source: string;
    knowledge_base_id: string;
    document_id?: string;
  };
}

interface KnowledgeBaseQueryResultProps {
  result: QueryResultData;
  showDocumentLink?: boolean;
  showSource?: boolean;
  maxPreviewLength?: number;
}

export const KnowledgeBaseQueryResult: React.FC<KnowledgeBaseQueryResultProps> = ({
  result,
  showDocumentLink = true,
  showSource = true,
  maxPreviewLength = 200,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(t('common.copiedToClipboard'));
    } catch (_error) {
      toast.error(t('common.copyFailed'));
    }
  };

  const handlePreview = () => {
    setShowPreviewModal(true);
  };

  const getTruncatedContent = (content: string) => {
    if (content.length <= maxPreviewLength) return content;
    return content.substring(0, maxPreviewLength) + '...';
  };

  const hasMore = result.content.length > maxPreviewLength;
  const displayContent = isExpanded ? result.content : getTruncatedContent(result.content);

  return (
    <>
      <Card className="mb-4">
        <div className="space-y-4">
          {/* Header with actions */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {showSource && (
                <div className="mb-2">
                  <p className="flex items-center text-sm text-muted-foreground">
                    <span className="me-2">{t('knowledgeBase.source')}:</span>
                    <span className="break-all text-primary">{result.metadata.source}</span>
                  </p>
                </div>
              )}
              <div className="flex items-center gap-x-2 text-sm text-muted-foreground">
                <span>
                  {t('knowledgeBase.chunk')} #{result.metadata.index}
                </span>
                <span>•</span>
                <span>
                  {t('knowledgeBase.id')}: {result.metadata.uuid.substring(0, 8)}...
                </span>
              </div>
            </div>

            <div className="flex items-center gap-x-2">
              {showDocumentLink && result.metadata.document_id && (
                <Link
                  to={`/dashboard/knowledge-base/${result.metadata.knowledge_base_id}/documents/${result.metadata.document_id}`}
                  className="inline-flex items-center rounded-md bg-primary-soft px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                  target="_blank"
                >
                  <ArrowTopRightOnSquareIcon className="me-1 h-3 w-3" />
                  {t('knowledgeBase.viewDocument')}
                </Link>
              )}
              <button
                type="button"
                onClick={handlePreview}
                className="inline-flex items-center p-2 text-muted-foreground transition-colors hover:text-muted-foreground"
                title={t('knowledgeBase.previewContent')}
              >
                <EyeIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCopy(result.content)}
                className="inline-flex items-center p-2 text-muted-foreground transition-colors hover:text-muted-foreground"
                title={t('knowledgeBase.copyContent')}
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="whitespace-pre-wrap rounded-md bg-muted p-4 font-sans text-sm text-muted-foreground">
            <p>{displayContent}</p>
            {hasMore && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
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
        </div>
      </Card>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={t('knowledgeBase.contentPreview')}
        size="6xl"
      >
        <div className="mt-4">
          <div className="mb-4 rounded-md bg-muted p-3">
            <div className="space-y-1 text-sm text-muted-foreground">
              {showSource && (
                <div>
                  <strong>{t('knowledgeBase.source')}:</strong> {result.metadata.source}
                </div>
              )}
              <div>
                <strong>{t('knowledgeBase.chunk')}:</strong> #{result.metadata.index} (
                {t('knowledgeBase.id')}: {result.metadata.uuid})
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <MarkdownRenderer content={result.content} />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default KnowledgeBaseQueryResult;
