import React from 'react';
import {
  DocumentTextIcon,
  BookOpenIcon,
  CodeBracketIcon,
  ChatBubbleLeftRightIcon,
  BugAntIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useSettings } from '../../contexts/SettingsProvider';

interface ResourceLink {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  external?: boolean;
  color: string;
}



export const ResourcesShortcuts: React.FC = () => {

  const { settings } = useSettings();
  
  const resources: ResourceLink[] = [
    {
      title: 'API Documentation',
      description: 'Complete API reference and guides',
      href: '/dashboard/api-reference',
      icon: DocumentTextIcon,
      external: false,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Developer Guides',
      description: 'In-depth development documentation',
      href: 'https://docs.watercrawl.dev/api/overview',
      icon: BookOpenIcon,
      external: true,
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Code Examples',
      description: 'Sample implementations and snippets',
      href: 'https://github.com/watercrawl/WaterCrawl/tree/main/tutorials',
      icon: CodeBracketIcon,
      external: true,
      color: 'text-gray-600 dark:text-gray-400'
    },
    {
      title: 'GitHub Discussions',
      description: 'Connect with other developers',
      href: 'https://github.com/watercrawl/WaterCrawl/discussions',
      icon: ChatBubbleLeftRightIcon,
      external: true,
      color: 'text-pink-600 dark:text-pink-400'
    },
    {
      title: 'Bug Reports',
      description: 'Report issues and feature requests',
      href: 'https://github.com/watercrawl/watercrawl/issues',
      icon: BugAntIcon,
      external: true,
      color: 'text-red-600 dark:text-red-400'
    },
    ...(settings?.is_enterprise_mode_active ? [
      {
        title: 'Status Page',
        description: 'System status and uptime monitoring',
        href: 'https://status.watercrawl.dev',
        icon: GlobeAltIcon,
        external: true,
      color: 'text-indigo-600 dark:text-indigo-400'
    }] : []),
  ];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <BookOpenIcon className="h-6 w-6 text-primary-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resources & Documentation</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Quick access to help and documentation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {resources.map((resource) => {
          const IconComponent = resource.icon;
          const linkProps = resource.external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {};

          return (
            <a
              key={resource.title}
              href={resource.href}
              {...linkProps}
              className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm group-hover:shadow-md transition-shadow`}>
                  <IconComponent className={`h-5 w-5 ${resource.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {resource.title}
                    </h3>
                    {resource.external && (
                      <svg className="h-3 w-3 text-gray-400 group-hover:text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {resource.description}
                  </p>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
        <div className="flex flex-wrap gap-3">
          <a
            href="https://docs.watercrawl.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
          >
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Full Documentation
          </a>
          <a
            href="https://github.com/watercrawl/watercrawl"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <CodeBracketIcon className="h-4 w-4 mr-2" />
            GitHub Repository
          </a>
          <a
            href="mailto:support@watercrawl.dev"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};
