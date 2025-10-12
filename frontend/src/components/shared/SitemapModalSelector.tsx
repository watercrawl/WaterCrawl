import React, { useState } from 'react';
import { MapIcon } from '@heroicons/react/24/outline';
import SitemapModal from '../SitemapModal';
import { CrawlRequest } from '../../types/crawl';
import { useTranslation } from 'react-i18next';

interface SitemapModalSelectorProps {
  request: CrawlRequest;
  className?: string;
  buttonWithText?: boolean;
}

export const SitemapModalSelector: React.FC<SitemapModalSelectorProps> = ({
  request,
  className = '',
  buttonWithText = false
}) => {
  const { t } = useTranslation();
  const [isSitemapModalOpen, setIsSitemapModalOpen] = useState(false);

  const handleOpenSitemap = (e: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
  
    if (!request.sitemap) return;
    setIsSitemapModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleOpenSitemap}
        disabled={!request.sitemap}
        className={`${className} ${
          buttonWithText 
            ? 'inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-primary-500 focus:ring-offset-2 transition-colors' 
            : 'text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400'
        } ${!request.sitemap ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={t('sitemap.viewSitemap')}
      >
        <MapIcon className={`${buttonWithText ? 'h-4 w-4 me-1.5' : 'h-5 w-5'}`} />
        {buttonWithText && t('sitemap.title')}
      </button>
      
      {/* Render modal only when needed */}
      {isSitemapModalOpen && (
        <SitemapModal
          isOpen={isSitemapModalOpen}
          onClose={() => setIsSitemapModalOpen(false)}
          request={request}
        />
      )}
    </>
  );
};

export default SitemapModalSelector;
