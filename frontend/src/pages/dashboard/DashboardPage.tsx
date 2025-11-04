import React, { useEffect } from 'react';
import { MCPServerAccess } from '../../components/dashboard/MCPServerAccess';
import { ResourcesShortcuts } from '../../components/dashboard/ResourcesShortcuts';
import { QuickNavigation } from '../../components/dashboard/QuickNavigation';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

const DashboardPage: React.FC = () => {
  const { setItems } = useBreadcrumbs();
  const { t } = useTranslation();

  useEffect(() => {
    setItems([{ label: t('common.dashboard'), href: '/dashboard', current: true }]);
  }, [setItems, t]);

  return (
    <div className="h-full">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-x-3">
            <div className="rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 p-2">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground sm:text-3xl">
              {t('dashboard.welcome')} WaterCrawl
            </h1>
          </div>
          <p className="max-w-2xl text-lg text-muted-foreground">
            {t('dashboard.messages.welcome')}
          </p>
        </div>

        {/* Quick Navigation */}
        <QuickNavigation />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-8">
            <ResourcesShortcuts />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <MCPServerAccess />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
