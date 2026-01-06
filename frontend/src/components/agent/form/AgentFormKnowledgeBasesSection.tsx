import React, { useState, useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import { PlusIcon } from '@heroicons/react/24/outline';

import EmptyState from '../EmptyState';
import ListItem from '../ListItem';
import SectionHeader from '../SectionHeader';
import UniversalSelector from '../UniversalSelector';

import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import Modal from '../../shared/Modal';

import type { AgentKnowledgeBase } from '../../../types/agent';
import type { KnowledgeBaseDetail } from '../../../types/knowledge';

interface AgentFormKnowledgeBasesSectionProps {
  draftKnowledgeBases: AgentKnowledgeBase[];
  onAdd: (kbUuid: string) => Promise<void>;
  onRemove: (kbUuid: string) => Promise<void>;
  onConfigure: (kb: AgentKnowledgeBase) => void;
}

const AgentFormKnowledgeBasesSection: React.FC<AgentFormKnowledgeBasesSectionProps> = ({
  draftKnowledgeBases,
  onAdd,
  onRemove,
  onConfigure,
}) => {
  const { t } = useTranslation();
  const [showKBSelector, setShowKBSelector] = useState(false);

  const fetchKnowledgeBases = useCallback(async (page: number, search: string) => {
    const response = await knowledgeBaseApi.list(page, 10, search);
    return {
      results: response.results.map((kb: KnowledgeBaseDetail) => ({
        uuid: kb.uuid,
        title: kb.title,
        description: kb.description,
      })),
      count: response.count,
    };
  }, []);

  const handleAdd = async (kbUuid: string) => {
    await onAdd(kbUuid);
    setShowKBSelector(false);
  };

  return (
    <div>
      <SectionHeader
        title={t('agents.form.knowledge')}
        rightContent={
          <button
            type="button"
            onClick={() => setShowKBSelector(true)}
            className="inline-flex items-center gap-x-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
          >
            <PlusIcon className="h-3 w-3" />
            {t('common.add')}
          </button>
        }
      />
      <div className="rounded-md border border-input-border bg-card p-3">
        {draftKnowledgeBases.length > 0 ? (
          <div className="space-y-1">
            {draftKnowledgeBases.map((kb) => (
              <ListItem
                key={kb.uuid}
                label={kb.title}
                onConfigure={() => onConfigure(kb)}
                onDelete={() => onRemove(kb.uuid)}
              />
            ))}
          </div>
        ) : (
          <EmptyState message={t('agents.form.noKnowledgeBases')} />
        )}
      </div>

      <Modal
        isOpen={showKBSelector}
        onClose={() => setShowKBSelector(false)}
        title={t('agents.form.addKnowledgeBase')}
        size="xl"
      >
        <UniversalSelector
          onSelect={handleAdd}
          selectedUuids={draftKnowledgeBases.map((kb) => kb.knowledge_base_uuid)}
          fetchData={fetchKnowledgeBases}
          searchPlaceholder={t('knowledgeBase.searchPlaceholder')}
          emptyMessage={t('knowledge.noKnowledgeBases')}
        />
      </Modal>
    </div>
  );
};

export default AgentFormKnowledgeBasesSection;
