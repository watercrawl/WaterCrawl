import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

import type { Agent } from '../../types/agent';

interface AgentCardProps {
  agent: Agent;
  onDelete: (uuid: string, name: string) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onDelete }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'published':
        return 'bg-success-soft text-success';
      case 'inactive':
      case 'archived':
        return 'bg-muted text-muted-foreground';
      case 'draft':
        return 'bg-warning-soft text-warning';
      case 'testing':
        return 'bg-info-soft text-info';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:shadow-md">
      {/* Card Header */}
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-start justify-between gap-x-3">
          <h3 className="flex-1 min-w-0 font-semibold text-foreground truncate">{agent.name}</h3>
          <span
            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${getStatusColor(agent.status)}`}
          >
            {t(`agents.status.${agent.status}`)}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-4 py-4">
        <dl className="space-y-3">
          {/* Created Date */}
          <div className="flex items-center justify-between">
            <dt className="text-sm font-medium text-muted-foreground">
              {t('agents.table.created')}
            </dt>
            <dd className="text-sm text-foreground">
              {new Date(agent.created_at).toLocaleDateString()}
            </dd>
          </div>

          {/* Last Updated */}
          <div className="flex items-center justify-between">
            <dt className="text-sm font-medium text-muted-foreground">
              {t('agents.table.updated')}
            </dt>
            <dd className="text-sm text-muted-foreground">
              {new Date(agent.updated_at).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      {/* Card Footer - Actions */}
      <div className="border-t border-border bg-muted/20 px-4 py-3">
        <div className="flex items-center justify-end gap-x-2">
          <button
            onClick={() => navigate(`/dashboard/agents/${agent.uuid}`)}
            className="inline-flex items-center gap-x-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <EyeIcon className="h-4 w-4" />
            {t('common.view')}
          </button>
          <button
            onClick={() => navigate(`/dashboard/agents/${agent.uuid}/edit`)}
            className="inline-flex items-center gap-x-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            <PencilIcon className="h-4 w-4" />
            {t('common.edit')}
          </button>
          <button
            onClick={() => onDelete(agent.uuid, agent.name)}
            className="inline-flex items-center gap-x-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-error hover:bg-error-soft"
          >
            <TrashIcon className="h-4 w-4" />
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentCard;
