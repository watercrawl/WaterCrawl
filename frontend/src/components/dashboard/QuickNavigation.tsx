import React from 'react';

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { GlobeAltIcon, MagnifyingGlassIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

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
  const { t } = useTranslation();

  const navigationItems: NavigationItem[] = [
    {
      href: '/dashboard/crawl',
      title: t('dashboard.quickActions.startCrawling'),
      description: t('dashboard.quickActions.crawlDescription'),
      icon: GlobeAltIcon,
      borderColor: 'hover:border-primary',
      iconBgColor: 'bg-primary/10 group-hover:bg-primary/15',
      iconColor: 'text-primary',
    },
    {
      href: '/dashboard/search',
      title: t('dashboard.quickActions.smartSearch'),
      description: t('dashboard.quickActions.searchDescription'),
      icon: MagnifyingGlassIcon,
      borderColor: 'hover:border-secondary',
      iconBgColor: 'bg-secondary/10 group-hover:bg-secondary/15',
      iconColor: 'text-secondary',
    },
    {
      href: '/dashboard/sitemap',
      title: t('dashboard.quickActions.generateSitemap'),
      description: t('dashboard.quickActions.sitemapDescription'),
      icon: DocumentTextIcon,
      borderColor: 'hover:border-tertiary',
      iconBgColor: 'bg-tertiary/10 group-hover:bg-tertiary/15',
      iconColor: 'text-tertiary',
    },
  ];

  return (
    <div className="mb-8 min-w-0">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {navigationItems.map(item => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`group rounded-xl border border-border bg-card p-4 transition-colors ${item.borderColor}`}
            >
              <div className="flex items-center gap-x-3">
                <div className={`rounded-lg p-2 transition-colors ${item.iconBgColor}`}>
                  <IconComponent className={`h-5 w-5 ${item.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
