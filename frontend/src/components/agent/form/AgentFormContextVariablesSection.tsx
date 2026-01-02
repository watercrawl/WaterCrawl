import React from 'react';

import { useTranslation } from 'react-i18next';

import EmptyState from '../EmptyState';
import ListItem from '../ListItem';
import SectionHeader from '../SectionHeader';

import type { ContextParameters } from '../../../types/agent';

interface AgentFormContextVariablesSectionProps {
  contextVariables: ContextParameters[];
  onAdd: () => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

const AgentFormContextVariablesSection: React.FC<AgentFormContextVariablesSectionProps> = ({
  contextVariables,
  onAdd,
  onEdit,
  onRemove,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <SectionHeader
        title={t('agents.testBench.contextVariables')}
        showAddButton
        onAdd={onAdd}
        addButtonLabel={t('common.add')}
      />
      <div className="rounded-md border border-input-border bg-card p-3">
        <p className="text-xs text-muted-foreground mb-2">
          {t('agents.form.contextVariablesHint')}
        </p>
        {contextVariables.length > 0 ? (
          <div className="space-y-1">
            {contextVariables.map((variable, index) => (
              <ListItem
                key={index}
                label=""
                onConfigure={() => onEdit(index)}
                onDelete={() => onRemove(index)}
                configureTitle={t('common.edit')}
              >
                <div className="flex items-center gap-x-2 text-xs font-mono">
                  <span className="font-semibold text-foreground">{`{{${variable.name}}}`}</span>
                  {variable.value && (
                    <>
                      <span className="text-muted-foreground">=</span>
                      <span className="text-primary">
                        {variable.parameter_type === 'string'
                          ? `"${variable.value}"`
                          : variable.value}
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground text-[10px]">
                    ({variable.parameter_type})
                  </span>
                </div>
              </ListItem>
            ))}
          </div>
        ) : (
          <EmptyState message={t('agents.testBench.noVariables')} />
        )}
      </div>
    </div>
  );
};

export default AgentFormContextVariablesSection;
