import React from 'react';

import { useTranslation } from 'react-i18next';

import ModelSelector from '../../shared/ModelSelector';

interface AgentFormLLMConfigSectionProps {
  providerConfigId: string;
  modelKey: string;
  llmConfigs: Record<string, unknown>;
  onConfigChange: (values: {
    provider_config_id: string | null;
    model_key: string | null;
    model_config: Record<string, unknown>;
  }) => void;
}

const AgentFormLLMConfigSection: React.FC<AgentFormLLMConfigSectionProps> = ({
  providerConfigId,
  modelKey,
  llmConfigs,
  onConfigChange,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {t('agents.form.llmConfig')}
      </h2>
      <ModelSelector
        modelType="llm"
        initialProviderConfigId={providerConfigId || null}
        initialModelKey={modelKey || null}
        initialModelConfig={llmConfigs}
        onChange={onConfigChange}
        showLabel={false}
        placeholder={t('common.llmSelector.selectModel')}
      />
    </div>
  );
};

export default AgentFormLLMConfigSection;
