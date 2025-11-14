import React, { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { CrawlForm } from '../../components/crawl/CrawlForm';
import PageHeader from '../../components/shared/PageHeader';
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
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader titleKey="crawl.title" descriptionKey="crawl.subtitle" />

      <div className="grid grid-cols-1 gap-6">
        <CrawlForm initialRequest={initialRequest} />
      </div>
    </div>
  );
};

export default CrawlPage;
