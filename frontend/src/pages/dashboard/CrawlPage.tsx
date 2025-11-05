import React, { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { CrawlForm } from '../../components/crawl/CrawlForm';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { CrawlRequest } from '../../types/crawl';

const CrawlPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [initialRequest, setInitialRequest] = useState<CrawlRequest | null>(null);
  const { setItems } = useBreadcrumbs();
  useEffect(() => {
    setItems([
      { label: t('dashboard.title'), href: '/dashboard' },
      { label: t('crawl.title'), href: '/dashboard/crawl', current: true },
    ]);
  }, [setItems, t]);

  useEffect(() => {
    // Load request from navigation state if available
    if (location.state?.request && !initialRequest) {
      setInitialRequest(location.state.request);
    }
  }, [location.state, initialRequest]);

  return (
    <div className="space-y-6 px-8 py-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t('crawl.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('crawl.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <CrawlForm initialRequest={initialRequest} />
      </div>
    </div>
  );
};

export default CrawlPage;
