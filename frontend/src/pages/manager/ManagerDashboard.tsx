import React, { useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { ServerIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

import AdminCard from '../../components/manager/AdminCard';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { setItems } = useBreadcrumbs();

  useEffect(() => {
    setItems([{ label: t('dashboard.navigation.adminPanel'), href: '/manage', current: true }]);
  }, [setItems, t]);

  return (
    <div className="py-6">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">{t('admin.dashboard')}</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Proxies Card */}
        <AdminCard
          icon={ServerIcon}
          title={t('admin.proxies.title')}
          description={t('settings.proxy.subtitle')}
          linkText={t('common.actions')}
          linkTo="/manager/proxies"
        />

        {/* LLM Providers Card */}
        <AdminCard
          icon={Cog6ToothIcon}
          title={t('admin.llm.title')}
          description={t('providerConfig.subtitle')}
          linkText={t('common.actions')}
          linkTo="/manager/llm-providers"
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
