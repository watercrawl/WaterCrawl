import { useState, useCallback, useEffect } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { agentApi } from '../services/api/agent';

interface UseAgentToolConfigReturn {
  enableAsTool: boolean;
  toolFunctionName: string;
  toolDescription: string;
  setEnableAsTool: React.Dispatch<React.SetStateAction<boolean>>;
  setToolFunctionName: React.Dispatch<React.SetStateAction<string>>;
  setToolDescription: React.Dispatch<React.SetStateAction<string>>;
  saveToolConfig: () => Promise<void>;
  agentUsageCount: number;
}

export const useAgentToolConfig = (
  agentId: string | undefined,
  initialEnableAsTool: boolean = false,
  initialToolFunctionName: string = '',
  initialToolDescription: string = ''
): UseAgentToolConfigReturn => {
  const { t } = useTranslation();
  const [enableAsTool, setEnableAsTool] = useState(initialEnableAsTool);
  const [toolFunctionName, setToolFunctionName] = useState(initialToolFunctionName);
  const [toolDescription, setToolDescription] = useState(initialToolDescription);
  const [agentUsageCount] = useState(0); // This will be fetched from backend when needed

  // Update state when initial values change (when agentData is loaded)
  useEffect(() => {
    setEnableAsTool(initialEnableAsTool);
    setToolFunctionName(initialToolFunctionName || '');
    setToolDescription(initialToolDescription || '');
  }, [initialEnableAsTool, initialToolFunctionName, initialToolDescription]);

  const saveToolConfig = useCallback(async () => {
    if (!agentId) return;

    try {
      await agentApi.update(agentId, {
        enable_as_tool: enableAsTool,
        tool_function_name: enableAsTool ? toolFunctionName : '',
        tool_description: enableAsTool ? toolDescription : '',
      });
      toast.success(t('agents.form.toolConfigSaved'));
    } catch (error: any) {
      console.error('Error saving tool configuration:', error);
      const errorMessage = error.response?.data?.tool_function_name
        || error.response?.data?.tool_description
        || error.response?.data?.enable_as_tool
        || error.response?.data?.message
        || t('errors.generic');
      toast.error(errorMessage);
      // Do not re-throw the error to prevent unhandled promise rejections.
    }
  }, [agentId, enableAsTool, toolFunctionName, toolDescription, t]);

  return {
    enableAsTool,
    toolFunctionName,
    toolDescription,
    setEnableAsTool,
    setToolFunctionName,
    setToolDescription,
    saveToolConfig,
    agentUsageCount,
  };
};
