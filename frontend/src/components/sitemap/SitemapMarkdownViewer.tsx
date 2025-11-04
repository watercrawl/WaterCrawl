import React from 'react';
import { useTranslation } from 'react-i18next';

interface SitemapMarkdownViewerProps {
  markdownContent: string;
  isLoading: boolean;
}

const SitemapMarkdownViewer: React.FC<SitemapMarkdownViewerProps> = ({
  markdownContent,
  isLoading,
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">{t('sitemap.loadingMarkdown')}</div>
    );
  }

  if (!markdownContent) {
    return (
      <div className="py-8 text-center text-muted-foreground">{t('sitemap.noMarkdownContent')}</div>
    );
  }

  return (
    <pre className="overflow-auto whitespace-pre-wrap rounded-md bg-card p-4 font-mono text-sm text-foreground shadow-inner">
      {markdownContent}
    </pre>
  );
};

export default SitemapMarkdownViewer;
