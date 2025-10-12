import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LinkIcon, DocumentIcon, PencilIcon, GlobeAltIcon, CodeBracketIcon, MapIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { ChevronRight } from '../../../components/shared/DirectionalIcon';

interface ImportMethod {
  id: string;
  name: string;
  description: string;
  icon: React.FC<React.ComponentProps<"svg">>;
  path: string;
  category: 'crawl' | 'sitemap' | 'manual';
}

const KnowledgeBaseImportOptionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const navigate = useNavigate();

  const importMethods: ImportMethod[] = [
    {
      id: 'select-crawl',
      name: t('knowledgeBase.import.selectCrawl'),
      description: t('knowledgeBase.import.selectCrawlDesc'),
      icon: LinkIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-crawl`,
      category: 'crawl'
    },
    {
      id: 'new-crawl',
      name: t('knowledgeBase.import.newCrawl'),
      description: t('knowledgeBase.import.newCrawlDesc'),
      icon: GlobeAltIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/new-crawl`,
      category: 'crawl'
    },
    {
      id: "select-sitemap",
      name: t('knowledgeBase.import.selectSitemap'),
      description: t('knowledgeBase.import.selectSitemapDesc'),
      icon: LinkIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-sitemap`,
      category: 'sitemap'
    },
    {
      id: "new-sitemap",
      name: t('knowledgeBase.import.newSitemap'),
      description: t('knowledgeBase.import.newSitemapDesc'),
      icon: MapIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/new-sitemap`,
      category: 'sitemap'
    },
    {
      id: 'manual',
      name: t('knowledgeBase.import.manual'),
      description: t('knowledgeBase.import.manualDesc'),
      icon: PencilIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/manual`,
      category: 'manual'
    },
    {
      id: 'upload',
      name: t('knowledgeBase.import.upload'),
      description: t('knowledgeBase.import.uploadDesc'),
      icon: DocumentIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/upload`,
      category: 'manual'
    }
  ];

  const handleImportMethodSelect = (path: string) => {
    navigate(path);
  };

  // Group methods by category
  const crawlMethods = importMethods.filter(method => method.category === 'crawl');
  const sitemapMethods = importMethods.filter(method => method.category === 'sitemap');
  const manualMethods = importMethods.filter(method => method.category === 'manual');
  
  // Method item component - compact and clean design
  const MethodItem = ({ method, accentColor = 'primary' }: { 
    method: ImportMethod; 
    accentColor?: 'primary' | 'blue' | 'green' | 'purple';
  }) => {
    const iconColors = {
      primary: 'text-primary-500 dark:text-primary-400',
      blue: 'text-blue-500 dark:text-blue-400',
      green: 'text-green-500 dark:text-green-400',
      purple: 'text-purple-500 dark:text-purple-400'
    };
    
    return (
      <button
        key={method.id}
        type="button"
        onClick={() => handleImportMethodSelect(method.path)}
        className="group flex items-center w-full px-3 py-2 text-sm text-start font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900 transition-colors"
      >
        <method.icon className={`h-4 w-4 ${iconColors[accentColor]} me-3 flex-shrink-0`} aria-hidden="true" />
        <span className="truncate">{method.name}</span>
        <ChevronRight className="ms-auto h-4 w-4 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400" aria-hidden="true" />
      </button>
    );
  };

  // Section component with tabs
  const ImportSection = ({ 
    title, 
    icon: Icon, 
    description, 
    methods, 
    accentColor = 'primary' 
  }: { 
    title: string; 
    icon: React.FC<React.ComponentProps<"svg">>; 
    description: string; 
    methods: ImportMethod[];
    accentColor?: 'primary' | 'blue' | 'green' | 'purple'; 
  }) => {
    const iconColors = {
      primary: 'text-primary-500 dark:text-primary-400',
      blue: 'text-blue-500 dark:text-blue-400',
      green: 'text-green-500 dark:text-green-400',
      purple: 'text-purple-500 dark:text-purple-400'
    };

    return (
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center">
          <Icon className={`h-4 w-4 ${iconColors[accentColor]} me-2`} />
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h2>
        </div>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 px-4 pb-3">{description}</p>
        )}
        <div className="border-t border-gray-200 dark:border-gray-700">
          {methods.map((method) => (
            <div key={method.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
              <MethodItem method={method} accentColor={accentColor} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="py-5 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-lg font-medium text-gray-900 dark:text-white">
          {t('knowledgeBase.import.pageTitle')}
        </h1>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t('knowledgeBase.import.pageSubtitle')}
        </p>
      </div>

      {/* Web Crawler Section */}
      <ImportSection 
        title={t('knowledgeBase.import.webCrawler')} 
        icon={CodeBracketIcon}
        description={t('crawl.subtitle')}
        methods={crawlMethods}
        accentColor="blue"
      />

      {/* Sitemap Section */}
      <ImportSection 
        title={t('knowledgeBase.import.sitemap')} 
        icon={MapIcon}
        description={t('sitemap.subtitle')}
        methods={sitemapMethods}
        accentColor="green"
      />

      {/* Manual & Document Upload Section */}
      <ImportSection 
        title={t('knowledgeBase.import.manualUpload')} 
        icon={DocumentTextIcon}
        description={t('knowledgeBase.import.uploadDesc')}
        methods={manualMethods}
        accentColor="purple"
      />
    </div>
  );
};

export default KnowledgeBaseImportOptionsPage;
