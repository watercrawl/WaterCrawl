import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { Switch } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import SectionHeader from '../SectionHeader';

import { useDirection } from '../../../contexts/DirectionContext';
import Modal from '../../shared/Modal';

interface AgentFormToolConfigSectionProps {
  enableAsTool: boolean;
  toolFunctionName: string;
  toolDescription: string;
  onEnableAsToolChange: (enabled: boolean) => void;
  onToolFunctionNameChange: (name: string) => void;
  onToolDescriptionChange: (description: string) => void;
  agentUsageCount?: number;
}

const AgentFormToolConfigSection: React.FC<AgentFormToolConfigSectionProps> = ({
  enableAsTool,
  toolFunctionName,
  toolDescription,
  onEnableAsToolChange,
  onToolFunctionNameChange,
  onToolDescriptionChange,
  agentUsageCount = 0,
}) => {
  const { t } = useTranslation();
  const { direction } = useDirection();
  const [showDisableWarning, setShowDisableWarning] = useState(false);

  const handleToggle = (enabled: boolean) => {
    if (!enabled && enableAsTool && agentUsageCount > 0) {
      // Show warning modal when trying to disable
      setShowDisableWarning(true);
    } else {
      onEnableAsToolChange(enabled);
    }
  };

  const handleConfirmDisable = () => {
    onEnableAsToolChange(false);
    setShowDisableWarning(false);
  };

  return (
    <div>
      <SectionHeader title={t('agents.form.toolConfiguration')} />
      <div className="rounded-md border border-input-border bg-card p-4">
        {/* Enable as Tool Toggle */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground">
                {t('agents.form.enableAsTool')}
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('agents.form.enableAsToolDescription')}
              </p>
            </div>
            <Switch
              checked={enableAsTool}
              onChange={handleToggle}
              className={`${
                enableAsTool ? 'bg-primary' : 'bg-muted'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
            >
              <span
                className={`${
                  enableAsTool ? (direction === 'rtl' ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </Switch>
          </div>
        </div>

        {/* Tool Configuration Fields - only show when enabled */}
        {enableAsTool && (
          <>
            {/* Function Name */}
            <div className="mb-4">
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
          </>
        )}
      </div>

      {/* Warning Modal for disabling when in use */}
      <Modal
        isOpen={showDisableWarning}
        onClose={() => setShowDisableWarning(false)}
        title={t('agents.form.disableToolWarningTitle')}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowDisableWarning(false)}
              className="rounded-md border border-input-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirmDisable}
              className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.confirm')}
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-foreground">
              {t('agents.form.disableToolWarningMessage', { count: agentUsageCount })}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('agents.form.disableToolWarningConsequence')}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AgentFormToolConfigSection;
