import { useEffect, useCallback } from 'react';

import type { ContextParameters } from '../types/agent';

interface UseVariableDetectionOptions {
  systemPrompt: string;
  existingVariables: ContextParameters[];
  onVariablesDetected: (variables: ContextParameters[]) => void;
  delay?: number;
}

/**
 * Custom hook to detect {{VARIABLE}} patterns in system prompt
 */
export const useVariableDetection = ({
  systemPrompt,
  existingVariables,
  onVariablesDetected,
  delay = 800,
}: UseVariableDetectionOptions) => {
  const detectVariables = useCallback(() => {
    if (!systemPrompt) return;

    // Match {{VAR_NAME}} patterns - must be complete (closed with }})
    const pattern = /\{\{([A-Z_][A-Z0-9_]*)\}\}/g;
    const matches = [...systemPrompt.matchAll(pattern)];
    const detectedVars = [...new Set(matches.map((m) => m[1]))];

    // Filter out variables that already exist
    const existingNames = new Set(existingVariables.map((v) => v.name));
    const newVars = detectedVars
      .filter((varName) => !existingNames.has(varName))
      .map((varName) => ({
        name: varName,
        value: '',
        parameter_type: 'string' as const,
      }));

    if (newVars.length > 0) {
      onVariablesDetected(newVars);
    }
  }, [systemPrompt, existingVariables, onVariablesDetected]);

  useEffect(() => {
    const timer = setTimeout(() => {
      detectVariables();
    }, delay);
    return () => clearTimeout(timer);
  }, [detectVariables, delay]);
};

