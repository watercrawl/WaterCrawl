import React, { useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { MCPServerAccess } from '../../components/dashboard/MCPServerAccess';
import { QuickNavigation } from '../../components/dashboard/QuickNavigation';
import { ResourcesShortcuts } from '../../components/dashboard/ResourcesShortcuts';
import PageHeader from '../../components/shared/PageHeader';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

const DashboardPage: React.FC = () => {
  const { setItems } = useBreadcrumbs();
  const { t } = useTranslation();

  useEffect(() => {
    setItems([{ label: t('common.dashboard'), href: '/dashboard', current: true }]);
  }, [setItems, t]);

  return (
    <div className="h-full overflow-x-hidden">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <PageHeader titleKey="dashboard.welcome" descriptionKey="dashboard.messages.welcome" />
        </div>

        {/* Quick Navigation */}
        <QuickNavigation />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Left Column */}
          <div className="min-w-0 space-y-6">
            <ResourcesShortcuts />
          </div>

          {/* Right Column */}
          <div className="min-w-0 space-y-6">
            <MCPServerAccess />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
