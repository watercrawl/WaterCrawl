import React, { useEffect } from 'react';
import { ServerIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import AdminCard from '../../components/admin/AdminCard';

const AdminDashboard: React.FC = () => {
  const { setItems } = useBreadcrumbs();

  useEffect(() => {
    setItems([
      { label: 'Admin', href: '/admin', current: true },
    ]);
  }, [setItems]);

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Admin Dashboard
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Proxies Card */}
        <AdminCard
          icon={ServerIcon}
          title="Manage Proxies"
          description="Configure and manage proxy servers for web crawling operations."
          linkTo="/admin/proxies"
        />

        {/* LLM Providers Card */}
        <AdminCard
          icon={Cog6ToothIcon}
          title="Manage LLM Providers"
          description="Configure language model providers and manage API integrations."
          linkTo="/admin/llm-providers"
        />

      </div>
    </div>
  );
};

export default AdminDashboard;
