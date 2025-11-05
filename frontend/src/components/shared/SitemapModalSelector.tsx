import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { MapIcon } from '@heroicons/react/24/outline';

import SitemapModal from '../SitemapModal';

import { CrawlRequest } from '../../types/crawl';

interface SitemapModalSelectorProps {
  request: CrawlRequest;
  className?: string;
  buttonWithText?: boolean;
}

export const SitemapModalSelector: React.FC<SitemapModalSelectorProps> = ({
  request,
  className = '',
  buttonWithText = false,
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
            ? 'inline-flex items-center rounded-md border border-input-border bg-card px-3 py-1.5 font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-primary focus:ring-offset-2'
            : 'text-muted-foreground hover:text-muted-foreground'
        } ${!request.sitemap ? 'cursor-not-allowed opacity-50' : ''}`}
        title={t('sitemap.viewSitemap')}
      >
        <MapIcon className={`${buttonWithText ? 'me-1.5 h-4 w-4' : 'h-5 w-5'}`} />
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
