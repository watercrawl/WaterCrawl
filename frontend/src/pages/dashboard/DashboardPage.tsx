import React, { useEffect } from 'react';
import { MCPServerAccess } from '../../components/dashboard/MCPServerAccess';
import { ResourcesShortcuts } from '../../components/dashboard/ResourcesShortcuts';
import { QuickNavigation } from '../../components/dashboard/QuickNavigation';
import { SparklesIcon } from '@heroicons/react/24/outline';
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to WaterCrawl</h1>
          </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
              Your intelligent web crawling platform. Get started with API keys, connect AI assistants via MCP,
            or explore our comprehensive documentation.
            </p>
          </div>
        </div>
        </div>

        {/* Quick Navigation */}
        <QuickNavigation />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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
