import React from 'react';

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ArrowLeftIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface AgentFormHeaderProps {
  agentId: string;
  name: string;
  showSavedIndicator: boolean;
  isTabletOrMobile: boolean;
  publishing: boolean;
  saving: boolean;
  onVersionHistory: () => void;
  onPublish: () => void;
}

const AgentFormHeader: React.FC<AgentFormHeaderProps> = ({
  agentId,
  name,
  showSavedIndicator,
  isTabletOrMobile,
  publishing,
  saving,
  onVersionHistory,
  onPublish,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-x-4">
        <button
          onClick={() => navigate(`/dashboard/agents/${agentId}`)}
          className="inline-flex items-center gap-x-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('common.back')}
        </button>
        <div className="h-6 w-px bg-border" />
        <h1 className="text-lg font-semibold text-foreground">
          {name || t('agents.form.editTitle')}
        </h1>
      </div>
      <div className="flex items-center gap-x-3">
        {/* Saved Indicator */}
        {showSavedIndicator && (
          <div className="flex items-center gap-x-1 text-sm text-success">
            <CheckCircleIcon className="h-4 w-4" />
            <span>{t('common.saved')}</span>
          </div>
        )}

        {/* Version History Button */}
        <button
          type="button"
          onClick={onVersionHistory}
          className="inline-flex items-center gap-x-2 rounded-md border border-input-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
          title={t('agents.form.versionHistory')}
        >
          <ClockIcon className="h-4 w-4" />
          {!isTabletOrMobile && <span>{t('agents.form.history')}</span>}
        </button>

        <button
          type="button"
          onClick={() => navigate('/dashboard/agents')}
          className="rounded-md border border-input-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={onPublish}
          disabled={publishing || saving}
          className="inline-flex items-center gap-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {publishing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {t('agents.form.publishing')}
            </>
          ) : (
            t('agents.form.publish')
          )}
        </button>
      </div>
    </div>
  );
};

export default AgentFormHeader;
