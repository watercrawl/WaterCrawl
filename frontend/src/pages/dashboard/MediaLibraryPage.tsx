import React, { useEffect, useState, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import {
  TrashIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';

import PageHeader from '../../components/shared/PageHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useDateLocale } from '../../hooks';
import { mediaApi } from '../../services/api/media';
import { Media } from '../../types/media';
import { formatDistanceToNowLocalized } from '../../utils/dateUtils';

const MediaLibraryPage: React.FC = () => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { setItems } = useBreadcrumbs();
  const { confirm } = useConfirm();
  const [mediaFiles, setMediaFiles] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setItems([
      { label: t('common.dashboard'), href: '/dashboard' },
      { label: t('mediaLibrary.title'), href: '/dashboard/media', current: true },
    ]);
  }, [setItems, t]);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mediaApi.list();
      setMediaFiles(data.results);
    } catch (error) {
      console.error('Error fetching media files:', error);
      toast.error(t('mediaLibrary.messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleDelete = useCallback(
    async (media: Media) => {
      confirm({
        title: t('mediaLibrary.deleteConfirm.title'),
        message: t('mediaLibrary.deleteConfirm.message', { fileName: media.file_name }),
        confirmText: t('common.delete'),
        cancelText: t('common.cancel'),
        onConfirm: async () => {
          await mediaApi.delete(media.uuid);
          toast.success(t('mediaLibrary.messages.deleteSuccess'));
          fetchMedia();
        },
      });
    },
    [confirm, t, fetchMedia]
  );

  const handleDownload = useCallback((media: Media) => {
    window.open(media.download_url, '_blank');
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('text/')) {
      return <DocumentIcon className="h-5 w-5 text-blue-500" />;
    }
    if (contentType.includes('json') || contentType.includes('xml')) {
      return <DocumentIcon className="h-5 w-5 text-green-500" />;
    }
    if (contentType.includes('csv') || contentType.includes('excel') || contentType.includes('spreadsheet')) {
      return <DocumentIcon className="h-5 w-5 text-yellow-500" />;
    }
    return <DocumentIcon className="h-5 w-5 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader titleKey="mediaLibrary.title" descriptionKey="mediaLibrary.subtitle" />
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader titleKey="mediaLibrary.title" descriptionKey="mediaLibrary.subtitle" />

      {mediaFiles.length === 0 ? (
        <div className="mt-8 text-center">
          <DocumentIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">{t('mediaLibrary.empty.title')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('mediaLibrary.empty.description')}</p>
        </div>
      ) : (
        <div className="mt-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">
                    {t('mediaLibrary.table.fileName')}
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                    {t('mediaLibrary.table.type')}
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                    {t('mediaLibrary.table.size')}
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                    {t('mediaLibrary.table.relatedObject')}
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                    {t('mediaLibrary.table.createdAt')}
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">{t('common.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {mediaFiles.map((media) => (
                  <tr key={media.uuid} className="hover:bg-muted/50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="flex items-center gap-2">
                        {getFileIcon(media.content_type)}
                        <span className="font-medium text-foreground">{media.file_name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                      {media.content_type}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                      {formatFileSize(media.size)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                      {media.related_object_type_name || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                      {formatDistanceToNowLocalized(new Date(media.created_at), dateLocale)}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(media)}
                          className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary-soft"
                          title={t('mediaLibrary.download')}
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(media)}
                          className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-error hover:bg-error-soft disabled:opacity-50"
                          title={t('common.delete')}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibraryPage;




