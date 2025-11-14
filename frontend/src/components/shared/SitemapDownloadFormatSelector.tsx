import React, { useState, useRef, useEffect } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

import { sitemapApi } from '../../services/api/sitemap';
import { SitemapRequest } from '../../types/sitemap';

type DownloadFormat = 'json' | 'markdown' | 'graph';

interface DownloadFormatSelectorProps {
  request: SitemapRequest;
  className?: string;
  buttonWithText?: boolean;
}

export const SitemapDownloadFormatSelector: React.FC<DownloadFormatSelectorProps> = ({
  request,
  className = '',
  buttonWithText = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDownload = async (format: DownloadFormat, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!request.uuid) return;

    try {
      setIsDownloading(true);
      let blob: Blob;
      if (format === 'json') {
        if (typeof request.result === 'string') {
          window.open(request.result);
          return;
        } else {
          blob = new Blob([JSON.stringify(request.result)], { type: 'application/json' });
        }
      } else if (format === 'markdown') {
        blob = new Blob([await sitemapApi.getMarkdown(request.uuid)], { type: 'text/markdown' });
      } else {
        blob = new Blob([JSON.stringify(await sitemapApi.getGraph(request.uuid))], {
          type: 'application/json',
        });
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sitemap-results-${request.uuid}.${format === 'markdown' ? 'md' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('common.downloadStarted'));
    } catch (error) {
      console.error('Error downloading results:', error);
      toast.error(t('common.downloadFailed'));
    } finally {
      setIsDownloading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {buttonWithText ? (
        <button
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="inline-flex items-center rounded-md border border-input-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="me-1.5 h-4 w-4" />
          {t('common.download')}
        </button>
      ) : (
        <button
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          disabled={isDownloading}
          className="text-muted-foreground hover:text-muted-foreground focus:outline-none"
          title={t('common.downloadResults')}
        >
          <ArrowDownTrayIcon className={`h-5 w-5 ${isDownloading ? 'animate-pulse' : ''}`} />
        </button>
      )}

      {isOpen && (
        <div className="absolute end-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <button
              onClick={e => handleDownload('json', e)}
              disabled={!request.result}
              className="block w-full px-4 py-2 text-start text-sm text-foreground hover:bg-muted"
            >
              {t('download.sitemapListJSON')}
            </button>
            <button
              onClick={e => handleDownload('markdown', e)}
              disabled={!request.result}
              className="block w-full px-4 py-2 text-start text-sm text-foreground hover:bg-muted"
            >
              {t('download.markdown')}
            </button>
            <button
              onClick={e => handleDownload('graph', e)}
              disabled={!request.result}
              className="block w-full px-4 py-2 text-start text-sm text-foreground hover:bg-muted"
            >
              {t('download.siteGraphJSON')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
