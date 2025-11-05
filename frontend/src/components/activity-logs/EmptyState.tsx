import React from 'react';

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { SpiderIcon } from '../icons/SpiderIcon';

export const EmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="py-12 text-center">
      <div className="flex justify-center">
        <SpiderIcon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        {t('activityLogs.emptyState.title')}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">{t('activityLogs.emptyState.message')}</p>
      <div className="mt-6">
        <Link
          to="/dashboard/crawl"
          className="inline-flex items-center rounded-md border border-transparent bg-primary-hover px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {t('activityLogs.emptyState.goToCrawl')}
        </Link>
      </div>
    </div>
  );
};
