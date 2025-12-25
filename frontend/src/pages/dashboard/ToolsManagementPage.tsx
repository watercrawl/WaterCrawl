import { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import APISpecsTab from '../../components/tools/APISpecsTab';
import BuiltInToolsTab from '../../components/tools/BuiltInToolsTab';
import MCPServersTab from '../../components/tools/MCPServersTab';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

type TabType = 'builtin' | 'api_specs' | 'mcp_servers';

const ToolsManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { setItems } = useBreadcrumbs();
  const [activeTab, setActiveTab] = useState<TabType>('builtin');

  useEffect(() => {
    setItems([
      { label: t('dashboard.navigation.dashboard'), href: '/dashboard' },
      { label: t('tools.management'), current: true },
    ]);
  }, [t, setItems]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'builtin':
        return <BuiltInToolsTab />;
      case 'api_specs':
        return <APISpecsTab />;
      case 'mcp_servers':
        return <MCPServersTab />;
    }
  };

  return (
    <div className="h-full bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('tools.management')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('tools.managementDescription')}</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('builtin')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'builtin'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            {t('tools.tabs.builtin')}
          </button>
          <button
            onClick={() => setActiveTab('api_specs')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'api_specs'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            {t('tools.tabs.apiSpecs')}
          </button>
          <button
            onClick={() => setActiveTab('mcp_servers')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'mcp_servers'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            {t('tools.tabs.mcpServers')}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default ToolsManagementPage;
