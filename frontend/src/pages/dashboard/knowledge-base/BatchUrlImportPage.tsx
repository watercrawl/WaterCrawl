import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { Button } from '../../../components/shared/Button';
import { ArrowUpOnSquareIcon, LinkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const BatchUrlImportPage: React.FC = () => {
  const { t } = useTranslation();
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const [urls, setUrls] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!knowledgeBaseId) {
      navigate('/dashboard/knowledge-base');
      return;
    }

    knowledgeBaseApi.get(knowledgeBaseId).then(kb => {
      setItems([
        { label: t('common.dashboard'), href: '/dashboard' },
        { label: t('settings.knowledgeBase.title'), href: '/dashboard/knowledge-base' },
        { label: kb.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}` },
        { label: t('settings.knowledgeBase.batchUrls.title'), current: true },
      ]);
    }).catch(() => {
      toast.error(t('settings.knowledgeBase.toast.loadError'));
      navigate('/dashboard/knowledge-base');
    });
  }, [knowledgeBaseId, navigate, setItems, t]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain') {
      toast.error(t('settings.knowledgeBase.batchUrls.invalidFileType'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setUrls(content);
      toast.success(t('settings.knowledgeBase.batchUrls.fileLoaded', { count: content.split('\n').filter(Boolean).length, filename: file.name }));
    };
    reader.onerror = () => {
      toast.error(t('settings.knowledgeBase.batchUrls.fileReadError'));
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!knowledgeBaseId) return;

    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);

    if (urlList.length === 0) {
      toast.error(t('settings.knowledgeBase.batchUrls.noUrls'));
      return;
    }

    setIsSubmitting(true);
    try {
      await knowledgeBaseApi.importFromUrls(knowledgeBaseId, { urls: urlList });
      toast.success(t('settings.knowledgeBase.batchUrls.importQueued', { count: urlList.length }));
      navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
    } catch (error) {
      toast.error(t('settings.knowledgeBase.batchUrls.importError'));
      console.error('Failed to import URLs:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const urlCount = urls.split('\n').filter(Boolean).length;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('settings.knowledgeBase.batchUrls.pageTitle')}</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {t('settings.knowledgeBase.batchUrls.pageSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="mb-4">
          <label htmlFor="urls-textarea" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            {t('settings.knowledgeBase.batchUrls.urlsLabel')}
          </label>
          <textarea
            id="urls-textarea"
            rows={15}
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            className="block w-full shadow-sm sm:text-sm rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500 dark:text-white ltr"
            placeholder={t('settings.knowledgeBase.batchUrls.placeholder')}
          />
        </div>

        <div className="flex items-center gap-4">
            <Button 
                type="submit"
                disabled={isSubmitting || urlCount === 0}
                loading={isSubmitting}
                variant="primary"
            >
                <LinkIcon className="h-5 w-5" />
                <span>{t('settings.knowledgeBase.batchUrls.importButton', { count: urlCount })}</span>
            </Button>
            <Button 
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
            >
                <ArrowUpOnSquareIcon className="h-5 w-5" />
                <span>{t('settings.knowledgeBase.batchUrls.uploadFile')}</span>
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt"
                className="hidden"
            />
        </div>
      </form>
    </div>
  );
};

export default BatchUrlImportPage;
