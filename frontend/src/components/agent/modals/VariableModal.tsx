import React from 'react';

import { useTranslation } from 'react-i18next';

import Modal from '../../shared/Modal';

import type { ContextParameters } from '../../../types/agent';

interface VariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  variableForm: ContextParameters;
  onVariableFormChange: (form: ContextParameters) => void;
  onSave: () => void;
  isEditing: boolean;
}

const VariableModal: React.FC<VariableModalProps> = ({
  isOpen,
  onClose,
  variableForm,
  onVariableFormChange,
  onSave,
  isEditing,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('agents.testBench.editVariable') : t('agents.testBench.addVariable')}
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            {t('common.save')}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('agents.testBench.variableKey')}
          </label>
          <input
            type="text"
            value={variableForm.name}
            onChange={(e) => onVariableFormChange({ ...variableForm, name: e.target.value })}
            placeholder="USER_ID"
            className="block w-full rounded-md border border-input-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('agents.testBench.variableValue')}
          </label>
          <input
            type="text"
            value={variableForm.value || ''}
            onChange={(e) => onVariableFormChange({ ...variableForm, value: e.target.value })}
            placeholder="12345 (optional)"
            className="block w-full rounded-md border border-input-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('agents.testBench.variableType')}
          </label>
          <select
            value={variableForm.parameter_type}
            onChange={(e) =>
              onVariableFormChange({
                ...variableForm,
                parameter_type: e.target.value as 'string' | 'number' | 'boolean',
              })
            }
            className="block w-full rounded-md border border-input-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="string">{t('agents.testBench.typeString')}</option>
            <option value="number">{t('agents.testBench.typeNumber')}</option>
            <option value="boolean">{t('agents.testBench.typeBoolean')}</option>
          </select>
        </div>
      </div>
    </Modal>
  );
};

export default VariableModal;
