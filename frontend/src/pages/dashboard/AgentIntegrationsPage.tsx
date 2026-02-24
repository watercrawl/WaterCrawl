import { useState, useEffect, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';

import { ArrowLeftIcon, DocumentTextIcon, LinkIcon } from '@heroicons/react/24/outline';

import { AgentApiDocumentation } from '../../components/agent/AgentApiDocumentation';
import Loading from '../../components/shared/Loading';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { agentApi } from '../../services/api/agent';

import type { Agent } from '../../types/agent';

type IntegrationTab = 'api' | 'webhooks' | 'embed';

const AgentIntegrationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const { agentId } = useParams<{ agentId: string }>();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<IntegrationTab>('api');

  const fetchAgent = useCallback(async () => {
    if (!agentId) return;

    setLoading(true);
    try {
      const agentData = await agentApi.get(agentId);
      setAgent(agentData);

      // Redirect if agent is not published
      if (agentData.status !== 'published') {
        toast.error(t('agents.integrations.publishedOnly'));
        navigate(`/dashboard/agents/${agentId}`);
      }
    } catch (error: any) {
      console.error('Error fetching agent:', error);
      toast.error(error.response?.data?.message || t('errors.generic'));
      navigate('/dashboard/agents');
    } finally {
      setLoading(false);
    }
  }, [agentId, navigate, t]);

  useEffect(() => {
    if (agentId) {
      fetchAgent();
    }
  }, [agentId, fetchAgent]);

  useEffect(() => {
    if (agent) {
      setItems([
        { label: t('dashboard.navigation.dashboard'), href: '/dashboard' },
        { label: t('dashboard.navigation.agents'), href: '/dashboard/agents' },
        { label: agent.name, href: `/dashboard/agents/${agentId}` },
        { label: t('agents.integrations.title'), current: true },
      ]);
    }
  }, [agent, agentId, setItems, t]);



  if (loading) {
    return <Loading />;
  }

  if (!agent) {
    return null;
  }

  const tabs: { id: IntegrationTab; label: string; icon: any; comingSoon?: boolean }[] = [
    {
      id: 'api',
      label: t('agents.integrations.apiDocumentation'),
      icon: DocumentTextIcon,
    },
    {
      id: 'webhooks',
      label: t('agents.integrations.webhooks'),
      icon: LinkIcon,
      comingSoon: true,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'api':
        return <AgentApiDocumentation agent={agent} />;
      case 'webhooks':
        return (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-md">
              <LinkIcon className="mx-auto h-16 w-16 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {t('agents.integrations.webhooksComingSoon')}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('agents.integrations.webhooksDesc')}
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-4">
            <button
              onClick={() => navigate(`/dashboard/agents/${agentId}`)}
              className="inline-flex items-center gap-x-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              {t('common.back')}
            </button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {agent.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('agents.integrations.title')}
              </p>
            </div>
          </div>
          <div>
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${
                agent.status === 'published'
                  ? 'bg-success-soft text-success'
                  : 'bg-warning-soft text-warning'
              }`}
            >
              {t(`agents.status.${agent.status}`)}
            </span>
          </div>
        </div>
      </div>

      {/* Split View */}
      <div className="flex h-[calc(100vh-128px-64px)]">
        {/* Sidebar Navigation */}
        <div className="w-64 border-r border-border bg-card flex-shrink-0">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {t('agents.integrations.integrationType')}
            </h3>
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => !tab.comingSoon && setActiveTab(tab.id)}
                    disabled={tab.comingSoon}
                    className={`w-full flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : tab.comingSoon
                        ? 'text-muted-foreground cursor-not-allowed opacity-60'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="flex-1 text-left">{tab.label}</span>
                    {tab.comingSoon && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {t('common.soon')}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AgentIntegrationsPage;
