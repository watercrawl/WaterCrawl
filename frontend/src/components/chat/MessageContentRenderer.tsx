import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { ArrowDownTrayIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

import MarkdownMessage from '../shared/MarkdownMessage';

import type { MessageContent, ContentPart, TextContentPart, ImageContentPart, FileContentPart } from '../../types/conversation';

/**
 * Check if content is an array of content parts
 */
const isContentPartArray = (content: MessageContent): content is ContentPart[] => {
  return Array.isArray(content);
};

/**
 * Extract text content from message content (string or array)
 */
export const extractTextContent = (content: MessageContent): string => {
  if (typeof content === 'string') {
    return content;
  }
  
  if (isContentPartArray(content)) {
    return content
      .filter((part): part is TextContentPart => part.type === 'text')
      .map(part => part.text)
      .join('\n');
  }
  
  return '';
};

/**
 * Check if message has any displayable content
 */
export const hasDisplayableContent = (content: MessageContent): boolean => {
  if (typeof content === 'string') {
    return content.trim().length > 0;
  }
  
  if (isContentPartArray(content)) {
    return content.some(part => {
      if (part.type === 'text') return part.text.trim().length > 0;
      if (part.type === 'image') return true;
      if (part.type === 'file') return true;
      return false;
    });
  }
  
  return false;
};

/**
 * Props for ImageThumbnail component
 */
interface ImageThumbnailProps {
  source: ImageContentPart['source'];
  alt?: string;
}

/**
 * ImageThumbnail - Displays image thumbnail with click to view full/download
 */
const ImageThumbnail: React.FC<ImageThumbnailProps> = ({ source, alt = 'Image' }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getImageSrc = (): string => {
    if (source.type === 'base64') {
      return `data:${source.media_type};base64,${source.data}`;
    }
    return source.data;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = getImageSrc();
    link.download = `image.${source.media_type.split('/')[1] || 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (imageError) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border text-muted-foreground text-sm">
        <DocumentIcon className="h-5 w-5" />
        <span>{t('chat.imageLoadError', 'Failed to load image')}</span>
      </div>
    );
  }

  return (
    <>
      {/* Thumbnail */}
      <div 
        className="inline-block cursor-pointer group relative"
        onClick={() => setIsModalOpen(true)}
      >
        <img
          src={getImageSrc()}
          alt={alt}
          className="max-w-[200px] max-h-[150px] rounded-lg border border-border object-cover hover:opacity-90 transition-opacity"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
          <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 bg-black/50 px-2 py-1 rounded">
            {t('chat.clickToView', 'Click to view')}
          </span>
        </div>
      </div>

      {/* Full-size Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            {/* Download button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="absolute -top-10 right-10 p-2 text-white hover:text-gray-300 transition-colors"
              title={t('common.download', 'Download')}
            >
              <ArrowDownTrayIcon className="h-6 w-6" />
            </button>
            
            <img
              src={getImageSrc()}
              alt={alt}
              className="max-w-full max-h-[85vh] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Props for FileDownload component
 */
interface FileDownloadProps {
  source: FileContentPart['source'];
}

/**
 * FileDownload - Displays file with download option
 */
const FileDownload: React.FC<FileDownloadProps> = ({ source }) => {
  const { t } = useTranslation();
  
  const getFileSrc = (): string => {
    if (source.type === 'base64') {
      return `data:${source.media_type};base64,${source.data}`;
    }
    return source.data;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = getFileSrc();
    link.download = source.filename || `file.${source.media_type.split('/')[1] || 'bin'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check if it's an image that should be displayed as thumbnail
  const isImage = source.media_type.startsWith('image/');
  
  if (isImage) {
    return (
      <ImageThumbnail 
        source={{ 
          type: source.type, 
          media_type: source.media_type, 
          data: source.data 
        }} 
        alt={source.filename}
      />
    );
  }

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors text-sm"
    >
      <DocumentIcon className="h-5 w-5 text-muted-foreground" />
      <span className="text-foreground font-medium">
        {source.filename || t('chat.downloadFile', 'Download File')}
      </span>
      <ArrowDownTrayIcon className="h-4 w-4 text-muted-foreground" />
    </button>
  );
};

/**
 * Props for MessageContentRenderer
 */
interface MessageContentRendererProps {
  content: MessageContent;
  textDirection?: 'ltr' | 'rtl';
}

/**
 * MessageContentRenderer - Renders message content handling both string and array formats
 */
const MessageContentRenderer: React.FC<MessageContentRendererProps> = ({ content, textDirection }) => {
  // Simple string content
  if (typeof content === 'string') {
    const trimmed = content.trim();
    if (!trimmed) return null;
    
    return (
      <div className="text-sm" dir={textDirection}>
        <MarkdownMessage content={trimmed} />
      </div>
    );
  }

  // Array of content parts
  if (isContentPartArray(content)) {
    const parts = content.filter(part => {
      // Filter out tool_use parts (handled separately by ToolCallRenderer)
      if (part.type === 'tool_use') return false;
      return true;
    });

    if (parts.length === 0) return null;

    return (
      <div className="space-y-3">
        {parts.map((part, index) => {
          switch (part.type) {
            case 'text': {
              const trimmed = part.text.trim();
              if (!trimmed) return null;
              return (
                <div key={`text-${index}`} className="text-sm" dir={textDirection}>
                  <MarkdownMessage content={trimmed} />
                </div>
              );
            }
            case 'image':
              return (
                <div key={`image-${index}`} className="my-2">
                  <ImageThumbnail source={part.source} />
                </div>
              );
            case 'file':
              return (
                <div key={`file-${index}`} className="my-2">
                  <FileDownload source={part.source} />
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    );
  }

  return null;
};

export default MessageContentRenderer;
