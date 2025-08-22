import React, { useEffect } from 'react';
import DashboardStats from '../../components/dashboard/DashboardStats';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

const DashboardPage: React.FC = () => {
  const {setItems} = useBreadcrumbs();
  useEffect(() => {
    setItems([
      { label: 'Dashboard', href: '/dashboard', current: true },
    ]);
  }, [setItems]);
  
  return (
    <div className="h-full">
      <div className="px-8 py-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard Overview</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Monitor your API usage and account balance
            </p>
          </div>
        </div>
        
        <div className="mt-8">
          <DashboardStats />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
