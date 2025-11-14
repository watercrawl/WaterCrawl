import React, { useEffect } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import {
  LinkIcon,
  DocumentIcon,
  PencilIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  MapIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

import { ChevronRight } from '../../../components/shared/DirectionalIcon';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';

interface ImportMethod {
  id: string;
  name: string;
  description: string;
  icon: React.FC<React.ComponentProps<'svg'>>;
  path: string;
  category: 'crawl' | 'sitemap' | 'manual';
}

const KnowledgeBaseImportOptionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();

  useEffect(() => {
    knowledgeBaseApi
      .get(knowledgeBaseId as string)
      .then(response => {
        setItems([
          { label: t('common.dashboard'), href: '/dashboard' },
          { label: t('settings.knowledgeBase.title'), href: '/dashboard/knowledge-base' },
          { label: response.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}` },
          { label: t('settings.knowledgeBase.import.title'), current: true },
        ]);
      })
      .catch(() => {
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
      category: 'crawl',
    },
    {
      id: 'new-crawl',
      name: t('settings.knowledgeBase.import.newCrawl'),
      description: t('settings.knowledgeBase.import.newCrawlDesc'),
      icon: GlobeAltIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/new-crawl`,
      category: 'crawl',
    },
    {
      id: 'select-sitemap',
      name: t('settings.knowledgeBase.import.selectSitemap'),
      description: t('settings.knowledgeBase.import.selectSitemapDesc'),
      icon: LinkIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-sitemap`,
      category: 'sitemap',
    },
    {
      id: 'new-sitemap',
      name: t('settings.knowledgeBase.import.newSitemap'),
      description: t('settings.knowledgeBase.import.newSitemapDesc'),
      icon: MapIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/new-sitemap`,
      category: 'sitemap',
    },
    {
      id: 'manual',
      name: t('settings.knowledgeBase.import.manual'),
      description: t('settings.knowledgeBase.import.manualDesc'),
      icon: PencilIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/manual`,
      category: 'manual',
    },
    {
      id: 'upload',
      name: t('settings.knowledgeBase.import.upload'),
      description: t('settings.knowledgeBase.import.uploadDesc'),
      icon: DocumentIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/upload`,
      category: 'manual',
    },
    {
      id: 'batch-urls',
      name: t('settings.knowledgeBase.import.batchUrls'),
      description: t('settings.knowledgeBase.import.batchUrlsDesc'),
      icon: LinkIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/batch-urls`,
      category: 'manual',
    },
  ];

  const handleImportMethodSelect = (path: string) => {
    navigate(path);
  };

  // Group methods by category
  const crawlMethods = importMethods.filter(method => method.category === 'crawl');
  const sitemapMethods = importMethods.filter(method => method.category === 'sitemap');
  const manualMethods = importMethods.filter(method => method.category === 'manual');

  // Method card component - extracted for reusability
  const MethodCard = ({
    method,
    accentColor = 'primary',
  }: {
    method: ImportMethod;
    accentColor?: 'primary' | 'secondary' | 'tertiary';
  }) => {
    const colorClasses = {
      primary: 'text-primary group-hover:bg-primary/10',
      secondary: 'text-secondary group-hover:bg-secondary/10',
      tertiary: 'text-tertiary group-hover:bg-tertiary/10',
    };

    return (
      <button
        key={method.id}
        type="button"
        onClick={() => handleImportMethodSelect(method.path)}
        className="group relative flex w-[600px] max-w-full overflow-hidden rounded-md border border-s-2 border-border bg-card transition-all duration-150 hover:shadow-sm"
      >
        <div className={`${colorClasses[accentColor]} flex w-full items-start p-4 text-start`}>
          <span className="me-3 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md">
            <method.icon className={`h-5 w-5 ${colorClasses[accentColor]} !bg-transparent`} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-foreground">{method.name}</h3>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{method.description}</p>
          </div>
          <span className="ms-3 flex-shrink-0 self-center text-muted-foreground">
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
    accentColor = 'primary',
  }: {
    title: string;
    icon: React.FC<React.ComponentProps<'svg'>>;
    methods: ImportMethod[];
    accentColor?: 'primary' | 'secondary' | 'tertiary';
  }) => {
    const iconColors = {
      primary: 'text-primary bg-primary/10',
      secondary: 'text-secondary bg-secondary/10',
      tertiary: 'text-tertiary bg-tertiary/10',
    };

    return (
      <div className="mb-8">
        <div className="mb-3 flex items-center">
          <span
            className={`me-2 inline-flex h-8 w-8 items-center justify-center rounded-md ${iconColors[accentColor]}`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <h3 className="text-base font-medium text-foreground">{title}</h3>
        </div>
        <div className="space-y-2">
          {methods.map(method => (
            <MethodCard key={method.id} method={method} accentColor={accentColor} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">
          {t('settings.knowledgeBase.import.pageTitle')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('settings.knowledgeBase.import.pageSubtitle')}
        </p>
      </div>

      {/* Web Crawler Section */}
      <ImportSection
        title={t('settings.knowledgeBase.import.webCrawler')}
        icon={CodeBracketIcon}
        methods={crawlMethods}
        accentColor="primary"
      />

      {/* Sitemap Section */}
      <ImportSection
        title={t('settings.knowledgeBase.import.sitemap')}
        icon={MapIcon}
        methods={sitemapMethods}
        accentColor="secondary"
      />

      {/* Manual & Document Upload Section */}
      <ImportSection
        title={t('settings.knowledgeBase.import.manualUpload')}
        icon={DocumentTextIcon}
        methods={manualMethods}
        accentColor="tertiary"
      />
    </div>
  );
};

export default KnowledgeBaseImportOptionsPage;
