import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardDocumentIcon, ChevronDownIcon, ChevronUpIcon, EyeIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Card from '../shared/Card';
import Modal from '../shared/Modal';
import MarkdownRenderer from '../shared/MarkdownRenderer';

interface QueryResultData {
  content: string;
  metadata: {
    index: number;
    uuid: string;
    source: string;
    knowledge_base_id: string;
    keywords: string[];
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
  maxPreviewLength = 200
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Content copied to clipboard!');
    } catch (_error) {
      toast.error('Failed to copy content');
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
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {showSource && (
                <div className="mb-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <span className="mr-2">Source:</span>
                    <span className="text-primary-600 dark:text-primary-400 break-all">{result.metadata.source}</span>
                  </p>
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Chunk #{result.metadata.index}</span>
                <span>•</span>
                <span>ID: {result.metadata.uuid.substring(0, 8)}...</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {showDocumentLink && result.metadata.document_id && (
                <Link
                  to={`/dashboard/knowledge-base/${result.metadata.knowledge_base_id}/documents/${result.metadata.document_id}`}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-600 bg-primary-100 rounded-md hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800 transition-colors"
                  target="_blank"
                >
                  <ArrowTopRightOnSquareIcon className="h-3 w-3 mr-1" />
                  View Document
                </Link>
              )}
              <button
                type="button"
                onClick={handlePreview}
                className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Preview full content"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleCopy(result.content)}
                className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Copy content"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
            <p>{displayContent}</p>
            {hasMore && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary-600 dark:text-primary-400 hover:underline text-sm mt-2 inline-flex items-center"
              >
                {isExpanded ? 'Show less' : 'Show more'}
                {isExpanded ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />}
              </button>
            )}
          </div>

          {/* Keywords */}
          {result.metadata.keywords && result.metadata.keywords.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Keywords</h5>
              <div className="flex flex-wrap gap-2">
                {result.metadata.keywords.map((keyword, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-700 bg-primary-100 rounded-full dark:bg-primary-900 dark:text-primary-300"
                  >
                    #{keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Content Preview"
        size="80vw"
      >
        <div className="mt-4">
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {showSource && (
                <div>
                  <strong>Source:</strong> {result.metadata.source}
                </div>
              )}
              <div>
                <strong>Chunk:</strong> #{result.metadata.index} (ID: {result.metadata.uuid})
              </div>
              {result.metadata.keywords.length > 0 && (
                <div>
                  <strong>Keywords:</strong> {result.metadata.keywords.join(', ')}
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <MarkdownRenderer content={result.content} />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default KnowledgeBaseQueryResult;
