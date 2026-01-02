import React, { useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import {
  PaperClipIcon,
  XMarkIcon,
  DocumentIcon,
  PhotoIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';

import { mediaApi } from '../../services/api/media';

import type { Media } from '../../types/media';

// Supported file types
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
  'application/xml',
];
const SUPPORTED_AUDIO_TYPES = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm'];

const ALL_SUPPORTED_TYPES = [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_FILE_TYPES, ...SUPPORTED_AUDIO_TYPES];

// Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface FileAttachmentItem {
  id: string;
  file: File;
  preview?: string;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
  media?: Media;
}

interface FileAttachmentProps {
  attachments: FileAttachmentItem[];
  onAttachmentsChange: (attachments: FileAttachmentItem[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

/**
 * Get icon component based on file type
 */
const getFileIcon = (contentType: string) => {
  if (SUPPORTED_IMAGE_TYPES.includes(contentType)) {
    return PhotoIcon;
  }
  if (SUPPORTED_AUDIO_TYPES.includes(contentType)) {
    return MusicalNoteIcon;
  }
  return DocumentIcon;
};

/**
 * Format file size for display
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * FileAttachment component - Handles file selection, preview, and upload
 */
const FileAttachment: React.FC<FileAttachmentProps> = ({
  attachments,
  onAttachmentsChange,
  disabled = false,
  maxFiles = 5,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Handle file selection from input or drop
   */
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxFiles - attachments.length;
    const filesToProcess = fileArray.slice(0, remainingSlots);

    const newAttachments: FileAttachmentItem[] = [];

    for (const file of filesToProcess) {
      // Validate file type
      if (!ALL_SUPPORTED_TYPES.includes(file.type)) {
        newAttachments.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          uploading: false,
          uploaded: false,
          error: t('chat.unsupportedFileType'),
        });
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        newAttachments.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          uploading: false,
          uploaded: false,
          error: t('chat.fileTooLarge'),
        });
        continue;
      }

      // Create preview for images
      let preview: string | undefined;
      if (SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        preview = URL.createObjectURL(file);
      }

      const attachment: FileAttachmentItem = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview,
        uploading: true,
        uploaded: false,
      };

      newAttachments.push(attachment);
    }

    // Add new attachments to state
    const updatedAttachments = [...attachments, ...newAttachments];
    onAttachmentsChange(updatedAttachments);

    // Upload files that don't have errors
    for (const attachment of newAttachments) {
      if (!attachment.error) {
        uploadFile(attachment, updatedAttachments);
      }
    }
  };

  /**
   * Upload a single file
   */
  const uploadFile = async (attachment: FileAttachmentItem, currentAttachments: FileAttachmentItem[]) => {
    try {
      const media = await mediaApi.upload({
        file: attachment.file,
        metadata: {},
      });

      // Update attachment with uploaded media
      const updatedAttachments = currentAttachments.map((a) =>
        a.id === attachment.id
          ? { ...a, uploading: false, uploaded: true, media }
          : a
      );
      onAttachmentsChange(updatedAttachments);
    } catch (error: unknown) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : t('chat.uploadFailed');
      
      // Update attachment with error
      const updatedAttachments = currentAttachments.map((a) =>
        a.id === attachment.id
          ? { ...a, uploading: false, error: errorMessage }
          : a
      );
      onAttachmentsChange(updatedAttachments);
    }
  };

  /**
   * Remove an attachment
   */
  const removeAttachment = (id: string) => {
    const attachment = attachments.find((a) => a.id === id);
    if (attachment?.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    onAttachmentsChange(attachments.filter((a) => a.id !== id));
  };

  /**
   * Handle drag events
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  /**
   * Handle file input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  /**
   * Open file picker
   */
  const openFilePicker = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const canAddMore = attachments.length < maxFiles;

  return (
    <div
      className={`relative ${isDragging ? 'bg-primary/5 ring-2 ring-primary ring-inset rounded-lg' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALL_SUPPORTED_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Attachment button */}
      {canAddMore && (
        <button
          type="button"
          onClick={openFilePicker}
          disabled={disabled}
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('chat.attachFile')}
        >
          <PaperClipIcon className="h-5 w-5" />
        </button>
      )}

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {attachments.map((attachment) => {
            const IconComponent = getFileIcon(attachment.file.type);
            const isImage = SUPPORTED_IMAGE_TYPES.includes(attachment.file.type);

            return (
              <div
                key={attachment.id}
                className={`relative group flex items-center gap-2 px-2 py-1.5 rounded-lg border ${
                  attachment.error
                    ? 'border-destructive bg-destructive/10'
                    : attachment.uploading
                    ? 'border-border bg-muted animate-pulse'
                    : 'border-border bg-card'
                }`}
              >
                {/* Preview or icon */}
                {isImage && attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="h-8 w-8 object-cover rounded"
                  />
                ) : (
                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                )}

                {/* File info */}
                <div className="flex flex-col min-w-0 max-w-[120px]">
                  <span className="text-xs font-medium text-foreground truncate">
                    {attachment.file.name}
                  </span>
                  {attachment.error ? (
                    <span className="text-xs text-destructive truncate">
                      {attachment.error}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.file.size)}
                    </span>
                  )}
                </div>

                {/* Upload indicator */}
                {attachment.uploading && (
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  disabled={disabled}
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 disabled:cursor-not-allowed"
                  title={t('common.remove')}
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg pointer-events-none">
          <div className="text-sm font-medium text-primary">
            {t('chat.dropFilesHere')}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileAttachment;
