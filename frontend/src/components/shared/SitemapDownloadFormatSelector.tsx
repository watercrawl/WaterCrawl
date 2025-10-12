import React, { useState, useRef, useEffect } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { SitemapRequest } from '../../types/sitemap';
import { sitemapApi } from '../../services/api/sitemap';
import { useTranslation } from 'react-i18next';

type DownloadFormat = 'json' | 'markdown' | 'graph';

interface DownloadFormatSelectorProps {
    request: SitemapRequest;
    className?: string;
    buttonWithText?: boolean;
}

export const SitemapDownloadFormatSelector: React.FC<DownloadFormatSelectorProps> = ({
    request,
    className = '',
    buttonWithText = false
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
                blob = new Blob([JSON.stringify(await sitemapApi.getGraph(request.uuid))], { type: 'application/json' });
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
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 focus:outline-none focus:ring-offset-2 focus:ring-primary-500"
                >
                    <ArrowDownTrayIcon className="h-4 w-4 me-1.5" />
                    {t('common.download')}
                </button>
            ) : (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    disabled={isDownloading}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                    title={t('common.downloadResults')}
                >
                    <ArrowDownTrayIcon className={`h-5 w-5 ${isDownloading ? 'animate-pulse' : ''}`} />
                </button>
            )}

            {isOpen && (
                <div className="absolute end-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                        <button
                            onClick={(e) => handleDownload('json', e)}
                            disabled={!request.result}
                            className="block w-full text-start px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            {t('download.sitemapListJSON')}
                        </button>
                        <button
                            onClick={(e) => handleDownload('markdown', e)}
                            disabled={!request.result}
                            className="block w-full text-start px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            {t('download.markdown')}
                        </button>
                        <button
                            onClick={(e) => handleDownload('graph', e)}
                            disabled={!request.result}
                            className="block w-full text-start px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            {t('download.siteGraphJSON')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
