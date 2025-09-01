import React from 'react';
import {
  GlobeAltIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface NavigationItem {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor: string;
  iconColor: string;
  borderColor: string;
}

export const QuickNavigation: React.FC = () => {
  const navigationItems: NavigationItem[] = [
    {
      href: '/dashboard/crawl',
      title: 'Start Crawling',
      description: 'Extract data from websites',
      icon: GlobeAltIcon,
      borderColor: 'hover:border-blue-200 dark:hover:border-blue-700',
      iconBgColor: 'bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      href: '/dashboard/search',
      title: 'Smart Search',
      description: 'Find information intelligently',
      icon: MagnifyingGlassIcon,
      borderColor: 'hover:border-green-200 dark:hover:border-green-700',
      iconBgColor: 'bg-green-50 dark:bg-green-900/20 group-hover:bg-green-100 dark:group-hover:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      href: '/dashboard/sitemap',
      title: 'Generate Sitemap',
      description: 'Create website structure maps',
      icon: DocumentTextIcon,
      borderColor: 'hover:border-purple-200 dark:hover:border-purple-700',
      iconBgColor: 'bg-purple-50 dark:bg-purple-900/20 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`group p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors ${item.borderColor}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg transition-colors ${item.iconBgColor}`}>
                  <IconComponent className={`h-5 w-5 ${item.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
