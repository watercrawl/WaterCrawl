import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Switch } from '@headlessui/react';
import { ArrowLeftIcon, ClockIcon, CheckCircleIcon, WrenchScrewdriverIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

import { useDirection } from '../../../contexts/DirectionContext';
import Modal from '../../shared/Modal';

interface AgentFormHeaderProps {
  agentId: string;
  name: string;
  showSavedIndicator: boolean;
  isTabletOrMobile: boolean;
  publishing: boolean;
  saving: boolean;
  isPublished: boolean;
  enableAsTool: boolean;
  toolFunctionName: string;
  toolDescription: string;
  onEnableAsToolChange: (enabled: boolean) => void;
  onToolFunctionNameChange: (name: string) => void;
  onToolDescriptionChange: (description: string) => void;
  onSaveToolConfig: () => Promise<void>;
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
  isPublished,
  enableAsTool,
  toolFunctionName,
  toolDescription,
  onEnableAsToolChange,
  onToolFunctionNameChange,
  onToolDescriptionChange,
  onSaveToolConfig,
  onVersionHistory,
  onPublish,
}) => {
  const { t } = useTranslation();
  const { direction } = useDirection();
  const navigate = useNavigate();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [pendingEnable, setPendingEnable] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);

  const handleToggleChange = (checked: boolean) => {
    if (checked) {
      // Enabling: check if fields are empty
      if (!toolFunctionName?.trim() || !toolDescription?.trim()) {
        setPendingEnable(true);
        setShowConfigModal(true);
        return;
      }
    }
    onEnableAsToolChange(checked);
  };

  const handleModalSave = async () => {
    if (!toolFunctionName?.trim() || !toolDescription?.trim()) {
      return; // Validation handled by disabled state
    }
    
    setModalSaving(true);
    try {
      if (pendingEnable) {
        onEnableAsToolChange(true);
      }
      await onSaveToolConfig();
      setPendingEnable(false);
      setShowConfigModal(false);
    } catch (_error) {
      // Error already handled by toast in useAgentToolConfig
      if (pendingEnable) {
        onEnableAsToolChange(false);
      }
    } finally {
      setModalSaving(false);
    }
  };

  const handleModalCancel = () => {
    setPendingEnable(false);
    setShowConfigModal(false);
  };

  return (
    <>
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

        {/* Enable as Tool - Only after publish */}
        {isPublished && (
          <div className="flex items-center gap-x-2 rounded-md border border-input-border bg-background px-3 py-2">
            <div className="flex items-center gap-x-2">
              <WrenchScrewdriverIcon className="h-4 w-4 text-muted-foreground" />
              {!isTabletOrMobile && (
                <span className="text-sm font-medium text-foreground">
                  {t('agents.form.enableAsTool')}
                </span>
              )}
              <Switch
                checked={enableAsTool}
                onChange={handleToggleChange}
                className={`${
                  enableAsTool ? 'bg-primary' : 'bg-muted'
                } relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
              >
                <span
                  className={`${
                    enableAsTool ? (direction === 'rtl' ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'
                  } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </Switch>
              {enableAsTool && (
                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  className="text-xs text-primary hover:text-primary-hover underline"
                >
                  {t('common.configure')}
                </button>
              )}
            </div>
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

    {/* Tool Configuration Modal */}
    <Modal
      isOpen={showConfigModal}
      onClose={handleModalCancel}
      title={t('agents.form.toolConfiguration')}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-x-3">
          <button
            onClick={handleModalCancel}
            className="rounded-md border border-input-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleModalSave}
            disabled={!toolFunctionName?.trim() || !toolDescription?.trim() || modalSaving}
            className="inline-flex items-center gap-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {modalSaving && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {modalSaving ? t('common.saving') : (pendingEnable ? t('common.save') : t('common.done'))}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Info Message */}
        <div className="flex gap-3 rounded-md bg-info-soft p-3">
          <InformationCircleIcon className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
          <p className="text-sm text-info">
            {t('agents.form.toolConfigInfoMessage')}
          </p>
        </div>

        {/* Function Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {t('agents.form.toolFunctionName')}
            <span className="text-error ml-1">*</span>
          </label>
          <input
            type="text"
            value={toolFunctionName}
            onChange={(e) => onToolFunctionNameChange(e.target.value)}
            placeholder={t('agents.form.toolFunctionNamePlaceholder')}
            className="w-full rounded-md border border-input-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t('agents.form.toolFunctionNameHint')}
          </p>
        </div>

        {/* Tool Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {t('agents.form.toolDescriptionLabel')}
            <span className="text-error ml-1">*</span>
          </label>
          <textarea
            value={toolDescription}
            onChange={(e) => onToolDescriptionChange(e.target.value)}
            placeholder={t('agents.form.toolDescriptionPlaceholder')}
            rows={4}
            className="w-full rounded-md border border-input-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t('agents.form.toolDescriptionHint')}
          </p>
        </div>
      </div>
    </Modal>
    </>
  );
};

export default AgentFormHeader;
