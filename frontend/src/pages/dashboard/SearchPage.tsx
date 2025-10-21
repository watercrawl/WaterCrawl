import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SearchForm } from '../../components/search/SearchForm';
import { SearchOptions } from '../../types/search';
import { useSettings } from '../../contexts/SettingsProvider';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useTranslation, Trans } from 'react-i18next';

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
    <div className="space-y-6 px-8 py-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t('search.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('search.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {!settings || !settings?.is_search_configured ? (
          <div className="rounded-lg border border-alert-info-border bg-alert-info-bg p-5 shadow-sm">
            <div className="flex items-start">
              <InformationCircleIcon
                className="me-3 h-6 w-6 flex-shrink-0 text-alert-info-icon"
                aria-hidden="true"
              />
              <div>
                <h3 className="text-lg font-medium text-alert-info-text">
                  {t('search.configuration.title')}
                </h3>
                <p className="mt-1 text-sm text-alert-info-text/90">
                  {t('search.configuration.description')}
                </p>
                <div className="mt-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {t('search.configuration.step1.title')}
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('search.configuration.step1.description')}
                    </p>
                    <div className="mt-1 gap-x-4 text-sm">
                      <a
                        href="https://developers.google.com/custom-search/v1/overview"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="me-4 font-medium text-primary hover:text-primary-dark"
                      >
                        {t('search.configuration.step1.apiDocs')}
                      </a>
                      <a
                        href="https://programmablesearchengine.google.com/controlpanel/all"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:text-primary-dark"
                      >
                        {t('search.configuration.step1.csePanel')}
                      </a>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {t('search.configuration.step2.title')}
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <Trans
                        i18nKey="search.configuration.step2.description"
                        components={{
                          code: <code />,
                          strong: <strong />,
                        }}
                      />
                    </p>
                    <pre className="ltr mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-background p-3 text-xs text-foreground">
                      <code>
                        {`SCRAPY_GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE
SCRAPY_GOOGLE_CSE_ID=YOUR_CSE_ID_HERE`}
                      </code>
                    </pre>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('search.configuration.step2.note')}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {t('search.configuration.step3.title')}
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <Trans
                        i18nKey="search.configuration.step3.description"
                        components={{
                          code: <code />,
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
