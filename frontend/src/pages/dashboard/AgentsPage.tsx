import { useState, useEffect, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import AgentCard from '../../components/agent/AgentCard';
import Loading from '../../components/shared/Loading';
import Modal from '../../components/shared/Modal';
import { PageHeader } from '../../components/shared/PageHeader';
import { Pagination } from '../../components/shared/Pagination';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useDateLocale, useIsTabletOrMobile } from '../../hooks';
import { agentApi } from '../../services/api/agent';
import { formatDistanceToNowLocalized } from '../../utils/dateUtils';

import type { Agent } from '../../types/agent';
import type { PaginatedResponse } from '../../types/common';

const AgentsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const dateLocale = useDateLocale();
  const { setItems } = useBreadcrumbs();
  const [agents, setAgents] = useState<PaginatedResponse<Agent> | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [creating, setCreating] = useState(false);
  const isTabletOrMobile = useIsTabletOrMobile();

  useEffect(() => {
    setItems([
      { label: t('dashboard.navigation.dashboard'), href: '/dashboard' },
      { label: t('dashboard.navigation.agents'), href: '/dashboard/agents', current: true },
    ]);
  }, [setItems, t]);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await agentApi.list();
      setAgents(data);
    } catch (error) {
      console.error('Error fetching agents:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error.response as { data?: { message?: string } })?.data?.message
          : undefined;
      toast.error(errorMessage || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAgents();
  }, [currentPage, fetchAgents]);

  const handleCreateAgent = useCallback(async () => {
    if (!newAgentName.trim()) {
      toast.error(t('agents.form.nameRequired'));
      return;
    }

    setCreating(true);
    try {
      const newAgent = await agentApi.create({ name: newAgentName.trim() });
      toast.success(t('agents.form.createSuccess'));
      setShowCreateModal(false);
      setNewAgentName('');
      navigate(`/dashboard/agents/${newAgent.uuid}/edit`);
    } catch (error) {
      console.error('Error creating agent:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error.response as { data?: { detail?: string } })?.data?.detail
          : undefined;
      toast.error(errorMessage || t('errors.generic'));
    } finally {
      setCreating(false);
    }
  }, [newAgentName, navigate, t]);

  const handleDelete = useCallback(
    (uuid: string, name: string) => {
      confirm({
        title: t('agents.deleteConfirmTitle'),
        message: t('agents.confirmDelete', { name }),
        variant: 'danger',
        confirmText: t('common.delete'),
        cancelText: t('common.cancel'),
        onConfirm: async () => {
          try {
            await agentApi.delete(uuid);
            toast.success(t('agents.deleteSuccess'));
            fetchAgents();
          } catch (error) {
            console.error('Error deleting agent:', error);
            const errorMessage =
              error && typeof error === 'object' && 'response' in error
                ? (error.response as { data?: { message?: string } })?.data?.message
                : undefined;
            toast.error(errorMessage || t('errors.generic'));
          }
        },
      });
    },
    [confirm, fetchAgents, t]
  );

  // No need for client-side filtering since backend handles it
  const filteredAgents = agents?.results || [];

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        titleKey="agents.title"
        descriptionKey="agents.description"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-x-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            <PlusIcon className="h-5 w-5" />
            {t('agents.createNew')}
          </button>
        }
      />

      {/* Agents List */}
      {isTabletOrMobile ? (
        /* Mobile and Tablet Card View */
        <div className="mt-8">
          {filteredAgents && filteredAgents.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredAgents.map(agent => (
                <AgentCard
                  key={agent.uuid}
                  agent={agent}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t('agents.noAgents')}
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 inline-flex items-center gap-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
                >
                  <PlusIcon className="h-4 w-4" />
                  {t('agents.createNew')}
                </button>
              </div>
            </div>
          )}

          {/* Pagination */}
          {agents && agents.count > 10 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalItems={agents.count}
                itemsPerPage={10}
                hasNextPage={!!agents.next}
                hasPreviousPage={!!agents.previous}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/30">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pe-3 ps-6 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t('agents.table.name')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t('agents.table.status')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t('agents.table.created')}
                </th>
                <th scope="col" className="relative py-3.5 pe-6 ps-3">
                  <span className="sr-only">{t('common.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filteredAgents && filteredAgents.length > 0 ? (
                filteredAgents.map((agent) => (
                  <tr key={agent.uuid} className="hover:bg-muted/30">
                    <td className="whitespace-nowrap py-4 pe-3 ps-6 text-sm font-medium text-foreground">
                      {agent.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                      <StatusBadge status={agent.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                      {formatDistanceToNowLocalized(new Date(agent.created_at), dateLocale, {
                        addSuffix: true,
                      })}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pe-6 ps-3 text-end text-sm font-medium">
                      <div className="flex items-center justify-end gap-x-4">
                        <button
                          onClick={() => navigate(`/dashboard/agents/${agent.uuid}`)}
                          className="text-muted-foreground hover:text-primary"
                          title={t('common.view')}
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/agents/${agent.uuid}/edit`)}
                          className="text-muted-foreground hover:text-primary"
                          title={t('common.edit')}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(agent.uuid, agent.name)}
                          className="text-muted-foreground hover:text-error"
                          title={t('common.delete')}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                    {t('agents.noAgents')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {agents && agents.count > 10 && (
            <div className="border-t border-border bg-muted/30 px-4 py-3">
              <Pagination
                currentPage={currentPage}
                totalItems={agents.count}
                itemsPerPage={10}
                hasNextPage={!!agents.next}
                hasPreviousPage={!!agents.previous}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Create Agent Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewAgentName('');
        }}
        title={t('agents.form.createTitle')}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="new-agent-name" className="block text-sm font-medium text-foreground mb-2">
              {t('agents.form.name')}
            </label>
            <input
              id="new-agent-name"
              type="text"
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newAgentName.trim()) {
                  handleCreateAgent();
                }
              }}
              placeholder={t('agents.form.namePlaceholder')}
              className="block w-full rounded-md border border-input-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-x-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setNewAgentName('');
              }}
              className="rounded-md border border-input-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleCreateAgent}
              disabled={creating || !newAgentName.trim()}
              className="inline-flex items-center gap-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t('common.creating')}
                </>
              ) : (
                t('agents.form.create')
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AgentsPage;
