import React from 'react';

import { useTranslation } from 'react-i18next';

import Modal from '../../shared/Modal';

import type { AgentVersionListItem } from '../../../types/agent';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: AgentVersionListItem[];
  onRevert: (versionUuid: string) => void;
}

const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  versions,
  onRevert,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('agents.form.versionHistory')}
      size="md"
    >
      <div className="space-y-2">
        {versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('agents.form.noVersions')}
          </div>
        ) : (
          versions.map((version) => (
            <div
              key={version.uuid}
              className="flex items-center justify-between rounded-md border border-border bg-card p-3 hover:bg-muted/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-x-2">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                      version.status === 'published'
                        ? 'bg-success-soft text-success'
                        : version.status === 'archived'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-warning-soft text-warning'
                    }`}
                  >
                    {t(`agents.status.${version.status}`)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(version.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              {version.status !== 'draft' && (
                <button
                  onClick={() => onRevert(version.uuid)}
                  className="inline-flex items-center gap-x-1 rounded-md border border-input-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                >
                  {t('agents.form.revert')}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

export default VersionHistoryModal;
