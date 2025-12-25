import React, { useState, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { PlusIcon } from '@heroicons/react/24/outline';

import DropdownMenu from '../DropdownMenu';
import EmptyState from '../EmptyState';
import ListItem from '../ListItem';
import SectionHeader from '../SectionHeader';

import type { AgentKnowledgeBase } from '../../../types/agent';
import type { KnowledgeBaseDetail } from '../../../types/knowledge';

interface AgentFormKnowledgeBasesSectionProps {
  draftKnowledgeBases: AgentKnowledgeBase[];
  knowledgeBases: KnowledgeBaseDetail[];
  onAdd: (kbUuid: string) => Promise<void>;
  onRemove: (kbUuid: string) => Promise<void>;
  onConfigure: (kb: AgentKnowledgeBase) => void;
}

const AgentFormKnowledgeBasesSection: React.FC<AgentFormKnowledgeBasesSectionProps> = ({
  draftKnowledgeBases,
  knowledgeBases,
  onAdd,
  onRemove,
  onConfigure,
}) => {
  const { t } = useTranslation();
  const [showKBSelector, setShowKBSelector] = useState(false);

  const availableKnowledgeBases = useMemo(
    () =>
      knowledgeBases.filter(
        (kb) => !draftKnowledgeBases.some((dkb) => dkb.knowledge_base_uuid === kb.uuid)
      ),
    [knowledgeBases, draftKnowledgeBases]
  );

  return (
    <div>
      <SectionHeader
        title={t('agents.form.knowledge')}
        rightContent={
          availableKnowledgeBases.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowKBSelector(!showKBSelector)}
                className="inline-flex items-center gap-x-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
              >
                <PlusIcon className="h-3 w-3" />
                {t('common.add')}
              </button>
              {showKBSelector && (
                <DropdownMenu
                  items={availableKnowledgeBases.map((kb) => ({
                    key: kb.uuid,
                    label: kb.title,
                    description: kb.description,
                  }))}
                  onSelect={(key) => {
                    onAdd(key);
                    setShowKBSelector(false);
                  }}
                  width="w-64"
                  maxHeight="max-h-64 overflow-y-auto"
                />
              )}
            </div>
          )
        }
      />
      {draftKnowledgeBases.length > 0 ? (
        <div className="space-y-1">
          {draftKnowledgeBases.map((kb) => (
            <ListItem
              key={kb.uuid}
              label={kb.title}
              onConfigure={() => onConfigure(kb)}
              onDelete={() => onRemove(kb.uuid)}
              configureTitle={t('common.config')}
            />
          ))}
        </div>
      ) : (
        <EmptyState message={t('agents.form.noKnowledgeBases')} />
      )}
    </div>
  );
};

export default AgentFormKnowledgeBasesSection;
