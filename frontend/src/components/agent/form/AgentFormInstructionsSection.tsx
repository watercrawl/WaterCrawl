import React from 'react';

import { useTranslation } from 'react-i18next';

import SectionHeader from '../SectionHeader';

import MonacoEditorField from '../../shared/MonacoEditorField';

interface AgentFormInstructionsSectionProps {
  name: string;
  systemPrompt: string;
  onNameChange: (name: string) => void;
  onSystemPromptChange: (prompt: string) => void;
}

const AgentFormInstructionsSection: React.FC<AgentFormInstructionsSectionProps> = ({
  name,
  systemPrompt,
  onNameChange,
  onSystemPromptChange,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <SectionHeader title={t('agents.form.instructions')} />
      <div className="rounded-md border border-input-border bg-card p-3">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">
              {t('agents.form.nameLabel')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t('agents.form.namePlaceholder')}
              className="block w-full rounded-md border border-input-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          
          <MonacoEditorField
            label={t('agents.form.systemPromptLabel')}
            hint={t('agents.form.systemPromptHint')}
            value={systemPrompt}
            onChange={onSystemPromptChange}
            language="markdown"
            height="150px"
          />
        </div>
      </div>
    </div>
  );
};

export default AgentFormInstructionsSection;
