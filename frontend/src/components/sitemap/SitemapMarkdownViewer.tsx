import React from 'react';
import { useTranslation } from 'react-i18next';

interface SitemapMarkdownViewerProps {
  markdownContent: string;
  isLoading: boolean;
}

const SitemapMarkdownViewer: React.FC<SitemapMarkdownViewerProps> = ({ 
  markdownContent,
  isLoading
}) => {
  const { t } = useTranslation();
  
  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {t('sitemap.loadingMarkdown')}
      </div>
    );
  }

  if (!markdownContent) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {t('sitemap.noMarkdownContent')}
      </div>
    );
  }

  return (
    <pre className="text-sm font-mono whitespace-pre-wrap p-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-md shadow-inner overflow-auto">
      {markdownContent}
    </pre>
  );
};

export default SitemapMarkdownViewer;
