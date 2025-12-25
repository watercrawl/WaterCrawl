import { useState, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import type { ContextParameters } from '../types/agent';

interface UseAgentContextVariablesReturn {
  showVariableModal: boolean;
  editingVariableIndex: number | null;
  variableForm: ContextParameters;
  setShowVariableModal: (show: boolean) => void;
  setVariableForm: (form: ContextParameters) => void;
  openVariableModal: (index?: number) => void;
  saveVariable: () => void;
  removeContextVariable: (index: number) => void;
}

export const useAgentContextVariables = (
  contextVariables: ContextParameters[],
  setContextVariables: React.Dispatch<React.SetStateAction<ContextParameters[]>>
): UseAgentContextVariablesReturn => {
  const { t } = useTranslation();
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [editingVariableIndex, setEditingVariableIndex] = useState<number | null>(null);
  const [variableForm, setVariableForm] = useState<ContextParameters>({
    name: '',
    value: '',
    parameter_type: 'string',
  });

  const openVariableModal = useCallback(
    (index?: number) => {
      if (index !== undefined) {
        const variable = contextVariables[index];
        setVariableForm(variable);
        setEditingVariableIndex(index);
      } else {
        setVariableForm({ name: '', value: '', parameter_type: 'string' });
        setEditingVariableIndex(null);
      }
      setShowVariableModal(true);
    },
    [contextVariables]
  );

  const saveVariable = useCallback(() => {
    if (!variableForm.name.trim()) {
      toast.error(t('agents.testBench.variableKeyRequired'));
      return;
    }

    if (editingVariableIndex !== null) {
      // Edit existing
      const updated = [...contextVariables];
      updated[editingVariableIndex] = variableForm;
      setContextVariables(updated);
    } else {
      // Add new
      if (contextVariables.some((v) => v.name === variableForm.name)) {
        toast.error(t('agents.testBench.variableDuplicate'));
        return;
      }
      setContextVariables([...contextVariables, variableForm]);
    }

    setShowVariableModal(false);
    setVariableForm({ name: '', value: '', parameter_type: 'string' });
  }, [variableForm, editingVariableIndex, contextVariables, setContextVariables, t]);

  const removeContextVariable = useCallback(
    (index: number) => {
      setContextVariables(contextVariables.filter((_, i) => i !== index));
    },
    [contextVariables, setContextVariables]
  );

  return {
    showVariableModal,
    editingVariableIndex,
    variableForm,
    setShowVariableModal,
    setVariableForm,
    openVariableModal,
    saveVariable,
    removeContextVariable,
  };
};
