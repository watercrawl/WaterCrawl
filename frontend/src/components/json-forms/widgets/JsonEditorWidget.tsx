import React, { useCallback, useEffect } from 'react';

import Editor from '@monaco-editor/react';

import { FieldProps } from '../types/schema';

import { useTheme } from '../../../contexts/ThemeContext';

export const JsonEditorWidget: React.FC<FieldProps> = ({ schema, value, onChange, errors }) => {
  const { isDark } = useTheme();
  const hasError = errors && errors.length > 0;
  const ui = schema.ui || {};

  // Initialize default value
  useEffect(() => {
    if (value === undefined) {
      if (schema.default !== undefined) {
        onChange(schema.default);
      } else if (schema.type === 'object' && schema.properties) {
        // Initialize with default values from properties
        const defaultValue: Record<string, any> = {};
        Object.entries(schema.properties).forEach(([key, propSchema]) => {
          if (propSchema.default !== undefined) {
            defaultValue[key] = propSchema.default;
          }
        });
        if (Object.keys(defaultValue).length > 0) {
          onChange(defaultValue);
        }
      }
    }
  }, [schema, value, onChange]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      try {
        if (!value) {
          onChange({});
          return;
        }
        const parsedValue = JSON.parse(value);
        onChange(parsedValue);
      } catch (_error) {
        // Don't update the value if JSON is invalid
        console.error('Invalid JSON:', _error);
      }
    },
    [onChange]
  );

  const stringifiedValue = React.useMemo(() => {
    try {
      return JSON.stringify(value || {}, null, 2);
    } catch (_error) {
      return '';
    }
  }, [value]);

  return (
    <div className={`ltr relative ${hasError ? 'rounded-md border border-error' : ''}`}>
      <Editor
        height={ui.editorHeight || '200px'}
        defaultLanguage="json"
        value={stringifiedValue}
        onChange={handleEditorChange}
        theme={isDark ? 'vs-dark' : 'light'}
        options={{
          minimap: { enabled: false },
          fontSize: ui.fontSize || 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly: schema.readOnly,
          ...ui.editorOptions,
        }}
      />
    </div>
  );
};
