import React, { useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import PageHeader from '../../components/shared/PageHeader';
import { SitemapForm } from '../../components/sitemap/SitemapForm';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { SitemapRequest } from '../../types/sitemap';

interface LocationState {
  request?: SitemapRequest;
}

const SitemapPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { request } = (location.state as LocationState) || {};
  const { setItems } = useBreadcrumbs();
  useEffect(() => {
    setItems([
      { label: t('dashboard.title'), href: '/dashboard' },
      { label: t('sitemap.title'), href: '/dashboard/sitemap', current: true },
    ]);
  }, [setItems, t]);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader titleKey="sitemap.title" descriptionKey="sitemap.subtitle" />

      <div className="grid grid-cols-1 gap-6">
        {/* Show the SitemapForm by default since there's no specific sitemap configuration check */}
        <SitemapForm initialRequest={request || null} />
      </div>
    </div>
  );
};

export default SitemapPage;
