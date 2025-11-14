import React, { useEffect } from 'react';

import { useTranslation, Trans } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { InformationCircleIcon } from '@heroicons/react/24/outline';

import { SearchForm } from '../../components/search/SearchForm';
import PageHeader from '../../components/shared/PageHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useSettings } from '../../contexts/SettingsProvider';
import { SearchOptions } from '../../types/search';

interface LocationState {
  initialQuery?: string;
  initialNumResults?: number;
  initialSearchOptions?: SearchOptions;
}

const SearchPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { initialQuery, initialNumResults, initialSearchOptions } =
    (location.state as LocationState) || {};

  const { settings } = useSettings();
  const { setItems } = useBreadcrumbs();
  useEffect(() => {
    setItems([
      { label: t('dashboard.title'), href: '/dashboard' },
      { label: t('search.title'), href: '/dashboard/search', current: true },
    ]);
  }, [setItems, t]);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader titleKey="search.title" descriptionKey="search.subtitle" />

      <div className="grid grid-cols-1 gap-6">
        {!settings || !settings?.is_search_configured ? (
          <div className="overflow-hidden rounded-xl border border-info bg-info-soft shadow-sm">
            <div className="flex items-start gap-4 p-6">
              <div className="shrink-0 rounded-lg bg-info/10 p-2 shadow-sm">
                <InformationCircleIcon className="h-6 w-6 text-info" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-info-strong">
                  {t('search.configuration.title')}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-info-strong/90">
                  {t('search.configuration.description')}
                </p>
                <div className="mt-6 space-y-4">
                  <div className="rounded-lg border border-info/20 bg-card/50 p-4">
                    <h4 className="text-sm font-bold text-foreground">
                      {t('search.configuration.step1.title')}
                    </h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {t('search.configuration.step1.description')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <a
                        href="https://developers.google.com/custom-search/v1/overview"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:bg-primary-hover"
                      >
                        {t('search.configuration.step1.apiDocs')}
                      </a>
                      <a
                        href="https://programmablesearchengine.google.com/controlpanel/all"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:bg-primary-hover"
                      >
                        {t('search.configuration.step1.csePanel')}
                      </a>
                    </div>
                  </div>
                  <div className="rounded-lg border border-info/20 bg-card/50 p-4">
                    <h4 className="text-sm font-bold text-foreground">
                      {t('search.configuration.step2.title')}
                    </h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      <Trans
                        i18nKey="search.configuration.step2.description"
                        components={{
                          code: (
                            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs" />
                          ),
                          strong: <strong className="font-semibold" />,
                        }}
                      />
                    </p>
                    <pre className="ltr mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-muted p-3 font-mono text-xs text-foreground shadow-sm">
                      <code>
                        {`SCRAPY_GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE
SCRAPY_GOOGLE_CSE_ID=YOUR_CSE_ID_HERE`}
                      </code>
                    </pre>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t('search.configuration.step2.note')}
                    </p>
                  </div>
                  <div className="rounded-lg border border-info/20 bg-card/50 p-4">
                    <h4 className="text-sm font-bold text-foreground">
                      {t('search.configuration.step3.title')}
                    </h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      <Trans
                        i18nKey="search.configuration.step3.description"
                        components={{
                          code: (
                            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs" />
                          ),
                        }}
                      />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <SearchForm
            initialQuery={initialQuery}
            initialNumResults={initialNumResults}
            initialSearchOptions={initialSearchOptions}
          />
        )}
      </div>
    </div>
  );
};

export default SearchPage;
