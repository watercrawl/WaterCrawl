import React from 'react';

import { useTranslation } from 'react-i18next';

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
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {t('agents.form.instructions')}
      </h2>
      <div className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t('agents.form.namePlaceholder')}
          className="block w-full rounded-md border border-input-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">
              {t('agents.form.systemPromptHint')}
            </span>
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
            placeholder={t('agents.form.systemPromptPlaceholder')}
            rows={5}
            className="block w-full rounded-md border border-input-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default AgentFormInstructionsSection;
