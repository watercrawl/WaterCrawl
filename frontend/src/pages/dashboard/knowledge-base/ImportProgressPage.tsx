import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  LinkIcon,
  DocumentIcon,
  PencilIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  MapIcon,
  DocumentTextIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface ImportMethod {
  id: string;
  name: string;
  description: string;
  icon: React.FC<React.ComponentProps<"svg">>;
  path: string;
  category: 'crawl' | 'sitemap' | 'manual';
}

const KnowledgeBaseImportOptionsPage: React.FC = () => {
  const { knowledgeBaseId } = useParams<{ knowledgeBaseId: string }>();
  const navigate = useNavigate();

  const importMethods: ImportMethod[] = [
    {
      id: 'select-crawl',
      name: 'Select Existing Crawl',
      description: 'Choose from your previously crawled websites',
      icon: LinkIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-crawl`,
      category: 'crawl'
    },
    {
      id: 'new-crawl',
      name: 'Run New Crawl',
      description: 'Crawl a new website and import its content',
      icon: GlobeAltIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/new-crawl`,
      category: 'crawl'
    },
    {
      id: "select-sitemap",
      name: "Select Existing Sitemap",
      description: "Select a sitemap to import its content",
      icon: LinkIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-sitemap`,
      category: 'sitemap'
    },
    {
      id: "new-sitemap",
      name: "Generate New Sitemap",
      description: "Create a new sitemap and import its content",
      icon: MapIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/new-sitemap`,
      category: 'sitemap'
    },
    {
      id: 'manual',
      name: 'Add Content Manually',
      description: 'Create a knowledge base item with custom title and content',
      icon: PencilIcon,
      path: `/dashboard/knowledge-base/${knowledgeBaseId}/import/manual`,
      category: 'manual'
    },
    {
      id: 'upload',
      name: 'Upload Documents',
      description: 'Upload PDF, DOCX, TXT or image files',
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
        className="group flex items-center w-full px-3 py-2 text-sm text-left font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900 transition-colors"
      >
        <method.icon className={`h-4 w-4 ${iconColors[accentColor]} mr-3 flex-shrink-0`} aria-hidden="true" />
        <span className="truncate">{method.name}</span>
        <ChevronRightIcon className="ml-auto h-4 w-4 text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400" aria-hidden="true" />
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
          <Icon className={`h-4 w-4 ${iconColors[accentColor]} mr-2`} />
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
          Import Content to Knowledge Base
        </h1>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Choose an import method below
        </p>
      </div>

      {/* Web Crawler Section */}
      <ImportSection 
        title="Web Crawler" 
        icon={CodeBracketIcon}
        description="Crawl websites to import their content into your knowledge base"
        methods={crawlMethods}
        accentColor="blue"
      />

      {/* Sitemap Section */}
      <ImportSection 
        title="Sitemap" 
        icon={MapIcon}
        description="Use sitemaps to efficiently import website content"
        methods={sitemapMethods}
        accentColor="green"
      />

      {/* Manual & Document Upload Section */}
      <ImportSection 
        title="Manual & Document Upload" 
        icon={DocumentTextIcon}
        description="Manually add content or upload document files"
        methods={manualMethods}
        accentColor="purple"
      />
    </div>
  );
};

export default KnowledgeBaseImportOptionsPage;
