import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SitemapForm } from '../../components/sitemap/SitemapForm';
import { SitemapRequest } from '../../types/sitemap';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useTranslation } from 'react-i18next';

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
      { label: t('dashboard.title'), href: '/dashboard'},
      { label: t('sitemap.title'), href: '/dashboard/sitemap', current: true },
    ]);
  }, [setItems, t]);

  return (
    <div className="px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t('sitemap.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('sitemap.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Show the SitemapForm by default since there's no specific sitemap configuration check */}
        <SitemapForm initialRequest={request || null} />
      </div>
    </div>
  );
};

export default SitemapPage;
