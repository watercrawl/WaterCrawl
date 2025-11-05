import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  DocumentTextIcon,
  BookOpenIcon,
  CodeBracketIcon,
  ChatBubbleLeftRightIcon,
  BugAntIcon,
  GlobeAltIcon,
  LanguageIcon,
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
  const { t } = useTranslation();
  const { settings } = useSettings();

  const resources: ResourceLink[] = [
    {
      title: t('dashboard.resources.apiDocs'),
      description: t('dashboard.resources.apiDocsDesc'),
      href: '/dashboard/api-reference',
      icon: DocumentTextIcon,
      external: false,
      color: 'text-primary',
    },
    {
      title: t('dashboard.resources.devGuides'),
      description: t('dashboard.resources.devGuidesDesc'),
      href: 'https://docs.watercrawl.dev/api/overview',
      icon: BookOpenIcon,
      external: true,
      color: 'text-primary',
    },
    {
      title: t('dashboard.resources.codeExamples'),
      description: t('dashboard.resources.codeExamplesDesc'),
      href: 'https://github.com/watercrawl/WaterCrawl/tree/main/tutorials',
      icon: CodeBracketIcon,
      external: true,
      color: 'text-muted-foreground',
    },
    {
      title: t('dashboard.resources.discussions'),
      description: t('dashboard.resources.discussionsDesc'),
      href: 'https://github.com/watercrawl/WaterCrawl/discussions',
      icon: ChatBubbleLeftRightIcon,
      external: true,
      color: 'text-primary',
    },
    {
      title: t('dashboard.resources.bugReports'),
      description: t('dashboard.resources.bugReportsDesc'),
      href: 'https://github.com/watercrawl/watercrawl/issues',
      icon: BugAntIcon,
      external: true,
      color: 'text-error',
    },
    {
      title: t('dashboard.resources.translations'),
      description: t('dashboard.resources.translationsDesc'),
      href: 'https://crowdin.com/project/watercrawl',
      icon: LanguageIcon,
      external: true,
      color: 'text-warning',
    },
    ...(settings?.is_enterprise_mode_active
      ? [
          {
            title: t('dashboard.resources.statusPage'),
            description: t('dashboard.resources.statusPageDesc'),
            href: 'https://status.watercrawl.dev',
            icon: GlobeAltIcon,
            external: true,
            color: 'text-primary',
          },
        ]
      : []),
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center gap-x-3">
        <BookOpenIcon className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t('dashboard.resources.title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('dashboard.resources.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {resources.map(resource => {
          const IconComponent = resource.icon;
          const linkProps = resource.external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {};

          return (
            <a
              key={resource.title}
              href={resource.href}
              {...linkProps}
              className="group rounded-lg border border-border bg-muted p-4 transition-all duration-200 hover:border-primary hover:shadow-md"
            >
              <div className="flex items-start gap-x-3">
                <div
                  className={`rounded-lg bg-background p-2 shadow-sm transition-shadow group-hover:shadow-md`}
                >
                  <IconComponent className={`h-5 w-5 ${resource.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-x-1">
                    <h3 className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                      {resource.title}
                    </h3>
                    {resource.external && (
                      <svg
                        className="h-3 w-3 text-muted-foreground group-hover:text-primary"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                          clipRule="evenodd"
                        />
                        <path
                          fillRule="evenodd"
                          d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {resource.description}
                  </p>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 border-t border-border pt-6">
        <div className="flex flex-wrap gap-3">
          <a
            href="https://docs.watercrawl.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <DocumentTextIcon className="me-2 h-4 w-4" />
            {t('dashboard.resources.fullDocs')}
          </a>
          <a
            href="https://github.com/watercrawl/watercrawl"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <CodeBracketIcon className="me-2 h-4 w-4" />
            {t('dashboard.resources.githubRepo')}
          </a>
          <a
            href="mailto:support@watercrawl.dev"
            className="inline-flex items-center rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ChatBubbleLeftRightIcon className="me-2 h-4 w-4" />
            {t('dashboard.resources.contactSupport')}
          </a>
        </div>
      </div>
    </div>
  );
};
