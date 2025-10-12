import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DocumentTextIcon,
  PaperClipIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { KnowledgeBaseDetail } from '../../../types/knowledge';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';

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
    knowledgeBaseApi.get(knowledgeBaseId as string).then((response) => {
      setKnowledgeBase(response);
    }).catch(() => {
      toast.error(t('settings.knowledgeBase.toast.loadError'));
      navigate('/dashboard/knowledge-base');
    });
  }, [knowledgeBaseId, navigate, t]);

  useEffect(() => {
    if (!knowledgeBase) return;
    setItems([
      { label: t('common.dashboard'), href: '/dashboard' },
      { label: t('settings.knowledgeBase.title'), href: '/dashboard/knowledge-base' },
      { label: knowledgeBase.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}`},
      { label: t('settings.knowledgeBase.import.title'), href: `/dashboard/knowledge-base/${knowledgeBaseId}/import`},
      { label: t('settings.knowledgeBase.uploadDocuments.title'), href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/upload`, current: true },
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
      await knowledgeBaseApi.importFromFiles(knowledgeBaseId, files, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      toast.success(t('settings.knowledgeBase.uploadDocuments.uploadSuccess', { count: files.length }));
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
      <div className="mb-6">
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-700'} ${isLoading ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-700' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
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
            className="mt-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            {t('settings.knowledgeBase.uploadDocuments.browse')}
          </button>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('settings.knowledgeBase.uploadDocuments.supportedFormats')}
          </p>
        </div>

        {files.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.knowledgeBase.uploadDocuments.selectedFiles', { count: files.length })}</h4>
            <ul className="border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-200 dark:divide-gray-700">
              {files.map((file, index) => (
                <li key={index} className="ps-3 pe-4 py-3 flex items-center justify-between text-sm">
                  <div className="w-0 flex-1 flex items-center">
                    <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                    <span className="ms-2 flex-1 w-0 truncate text-gray-800 dark:text-gray-200">{file.name}</span>
                  </div>
                  <div className="ms-4 flex-shrink-0">
                    <button type="button" onClick={() => removeFile(index)} disabled={isLoading} className="text-gray-400 hover:text-gray-500 disabled:cursor-not-allowed">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {isLoading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-2">{t('settings.knowledgeBase.uploadDocuments.uploadingProgress', { progress: uploadProgress })}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleUploadFiles}
              disabled={isLoading}
              className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? t('settings.knowledgeBase.uploadDocuments.uploading') : t('settings.knowledgeBase.uploadDocuments.uploadButton', { count: files.length })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadDocumentsPage;
