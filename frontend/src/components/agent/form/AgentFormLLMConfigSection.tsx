import React from 'react';

import { useTranslation } from 'react-i18next';

import SectionHeader from '../SectionHeader';

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
      <SectionHeader title={t('agents.form.llmConfig')} />
      <div className="rounded-md border border-input-border bg-card p-3">
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
    </div>
  );
};

export default AgentFormLLMConfigSection;
