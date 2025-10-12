import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LinkIcon, DocumentIcon, PencilIcon, GlobeAltIcon, CodeBracketIcon, MapIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import toast from 'react-hot-toast';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { ChevronRight } from '../../../components/shared/DirectionalIcon';
import { useTranslation } from 'react-i18next';

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
  const { setItems } = useBreadcrumbs();

  useEffect(() => {
    knowledgeBaseApi.get(knowledgeBaseId as string).then((response) => {
      setItems([
        { label: t('common.dashboard'), href: '/dashboard' },
        { label: t('settings.knowledgeBase.title'), href: '/dashboard/knowledge-base' },
        { label: response.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}` },
        { label: t('settings.knowledgeBase.import.title'), current: true }
      ]);
    }).catch(() => {
      toast.error(t('settings.knowledgeBase.toast.loadError'));
      navigate('/dashboard/knowledge-base');
    });
  }, [knowledgeBaseId, navigate, setItems, t]);



  const importMethods: ImportMethod[] = [
    {
      id: 'select-crawl',
      name: t('settings.knowledgeBase.import.selectCrawl'),
      description: t('settings.knowledgeBase.import.selectCrawlDesc'),
      icon: LinkIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-crawl`,
      category: 'crawl'
    },
    {
      id: 'new-crawl',
      name: t('settings.knowledgeBase.import.newCrawl'),
      description: t('settings.knowledgeBase.import.newCrawlDesc'),
      icon: GlobeAltIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/new-crawl`,
      category: 'crawl'
    },
    {
      id: "select-sitemap",
      name: t('settings.knowledgeBase.import.selectSitemap'),
      description: t('settings.knowledgeBase.import.selectSitemapDesc'),
      icon: LinkIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-sitemap`,
      category: 'sitemap'
    },
    {
      id: "new-sitemap",
      name: t('settings.knowledgeBase.import.newSitemap'),
      description: t('settings.knowledgeBase.import.newSitemapDesc'),
      icon: MapIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/new-sitemap`,
      category: 'sitemap'
    },
    {
      id: 'manual',
      name: t('settings.knowledgeBase.import.manual'),
      description: t('settings.knowledgeBase.import.manualDesc'),
      icon: PencilIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/manual`,
      category: 'manual'
    },
    {
      id: 'upload',
      name: t('settings.knowledgeBase.import.upload'),
      description: t('settings.knowledgeBase.import.uploadDesc'),
      icon: DocumentIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/upload`,
      category: 'manual'
    },
    {
      id: 'batch-urls',
      name: t('settings.knowledgeBase.import.batchUrls'),
      description: t('settings.knowledgeBase.import.batchUrlsDesc'),
      icon: LinkIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/batch-urls`,
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

  // Method card component - extracted for reusability
  const MethodCard = ({ method, accentColor = 'primary' }: {
    method: ImportMethod;
    accentColor?: 'primary' | 'blue' | 'green' | 'purple';
  }) => {
    const colorClasses = {
      primary: 'text-primary-600 dark:text-primary-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/10 border-s-primary-400',
      blue: 'text-blue-600 dark:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 border-s-blue-400',
      green: 'text-green-600 dark:text-green-400 group-hover:bg-green-50 dark:group-hover:bg-green-900/10 border-s-green-400',
      purple: 'text-purple-600 dark:text-purple-400 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/10 border-s-purple-400'
    };

    return (
      <button
        key={method.id}
        type="button"
        onClick={() => handleImportMethodSelect(method.path)}
        className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-s-2 hover:shadow-sm transition-all duration-150 flex w-[600px] max-w-full rounded-md overflow-hidden"
      >
        <div className={`${colorClasses[accentColor]} flex items-start p-4 w-full text-start`}>
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-md flex-shrink-0 me-3">
            <method.icon className={`h-5 w-5 ${colorClasses[accentColor]}`} />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{method.name}</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{method.description}</p>
          </div>
          <span className="ms-3 flex-shrink-0 self-center text-gray-400">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </button>
    );
  };

  // Section component - extracted for consistency
  const ImportSection = ({
    title,
    icon: Icon,
    methods,
    accentColor = 'primary'
  }: {
    title: string;
    icon: React.FC<React.ComponentProps<"svg">>;
    methods: ImportMethod[];
    accentColor?: 'primary' | 'blue' | 'green' | 'purple';
  }) => {
    const iconColors = {
      primary: 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20',
      blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
      green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
      purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
    };

    return (
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <span className={`inline-flex items-center justify-center h-8 w-8 rounded-md me-2 ${iconColors[accentColor]}`}>
            <Icon className="h-5 w-5" />
          </span>
          <h3 className="text-base font-medium text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="space-y-2">
          {methods.map((method) => (
            <MethodCard key={method.id} method={method} accentColor={accentColor} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('settings.knowledgeBase.import.pageTitle')}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {t('settings.knowledgeBase.import.pageSubtitle')}
        </p>
      </div>

      {/* Web Crawler Section */}
      <ImportSection
        title={t('settings.knowledgeBase.import.webCrawler')}
        icon={CodeBracketIcon}
        methods={crawlMethods}
        accentColor="blue"
      />

      {/* Sitemap Section */}
      <ImportSection
        title={t('settings.knowledgeBase.import.sitemap')}
        icon={MapIcon}
        methods={sitemapMethods}
        accentColor="green"
      />

      {/* Manual & Document Upload Section */}
      <ImportSection
        title={t('settings.knowledgeBase.import.manualUpload')}
        icon={DocumentTextIcon}
        methods={manualMethods}
        accentColor="purple"
      />
    </div>
  );
};

export default KnowledgeBaseImportOptionsPage;
