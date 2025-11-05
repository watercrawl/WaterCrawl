import React, { useState, useRef, useEffect } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { DocumentTextIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { AxiosError } from 'axios';

import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { KnowledgeBaseDetail } from '../../../types/knowledge';



const UploadDocumentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDetail | null>(null);

  useEffect(() => {
    if (!knowledgeBaseId) {
      navigate('/dashboard/knowledge-base');
    }
    knowledgeBaseApi
      .get(knowledgeBaseId as string)
      .then(response => {
        setKnowledgeBase(response);
      })
      .catch(() => {
        toast.error(t('settings.knowledgeBase.toast.loadError'));
        navigate('/dashboard/knowledge-base');
      });
  }, [knowledgeBaseId, navigate, t]);

  useEffect(() => {
    if (!knowledgeBase) return;
    setItems([
      { label: t('common.dashboard'), href: '/dashboard' },
      { label: t('settings.knowledgeBase.title'), href: '/dashboard/knowledge-base' },
      { label: knowledgeBase.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}` },
      {
        label: t('settings.knowledgeBase.import.title'),
        href: `/dashboard/knowledge-base/${knowledgeBaseId}/import`,
      },
      {
        label: t('settings.knowledgeBase.uploadDocuments.title'),
        href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/upload`,
        current: true,
      },
    ]);
  }, [knowledgeBase, knowledgeBaseId, setItems, t]);

  // File upload states
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isLoading && e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async () => {
    if (!knowledgeBaseId || files.length === 0) {
      toast.error(t('settings.knowledgeBase.uploadDocuments.noFilesSelected'));
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      await knowledgeBaseApi.importFromFiles(knowledgeBaseId, files, progressEvent => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      toast.success(
        t('settings.knowledgeBase.uploadDocuments.uploadSuccess', { count: files.length })
      );
      navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error?.response?.data?.message);
      } else {
        console.error('Failed to upload files:', error);
        toast.error(t('settings.knowledgeBase.uploadDocuments.uploadError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6"></div>

      <div className="rounded-lg bg-card p-6 shadow">
        <div
          className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors duration-200 ${isDragging ? 'border-primary bg-primary-soft' : 'border-input-border'} ${isLoading ? 'cursor-not-allowed bg-muted' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <DocumentTextIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium text-foreground">
            {t('settings.knowledgeBase.uploadDocuments.dragDrop')}
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            disabled={isLoading}
            accept=".md,.txt,.text,.html,.docx,.csv"
          />
          <button
            type="button"
            onClick={handleBrowseClick}
            disabled={isLoading}
            className="mt-2 text-sm font-medium text-primary hover:text-primary-strong disabled:cursor-not-allowed disabled:text-muted-foreground"
          >
            {t('settings.knowledgeBase.uploadDocuments.browse')}
          </button>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('settings.knowledgeBase.uploadDocuments.supportedFormats')}
          </p>
        </div>

        {files.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-medium text-foreground">
              {t('settings.knowledgeBase.uploadDocuments.selectedFiles', { count: files.length })}
            </h4>
            <ul className="divide-y divide-border rounded-md border border-border">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between py-3 pe-4 ps-3 text-sm"
                >
                  <div className="flex w-0 flex-1 items-center">
                    <PaperClipIcon
                      className="h-5 w-5 flex-shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="ms-2 w-0 flex-1 truncate text-foreground">{file.name}</span>
                  </div>
                  <div className="ms-4 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      disabled={isLoading}
                      className="text-muted-foreground hover:text-muted-foreground disabled:cursor-not-allowed"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {isLoading && (
              <div className="mt-4">
                <div className="h-2.5 w-full rounded-full bg-muted">
                  <div
                    className="h-2.5 rounded-full bg-primary"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  {t('settings.knowledgeBase.uploadDocuments.uploadingProgress', {
                    progress: uploadProgress,
                  })}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleUploadFiles}
              disabled={isLoading}
              className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted"
            >
              {isLoading
                ? t('settings.knowledgeBase.uploadDocuments.uploading')
                : t('settings.knowledgeBase.uploadDocuments.uploadButton', { count: files.length })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadDocumentsPage;
