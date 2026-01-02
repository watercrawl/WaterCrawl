import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import Editor, { EditorProps } from '@monaco-editor/react';

import { useTheme } from '../../contexts/ThemeContext';

import Modal from './Modal';

interface MonacoEditorFieldProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  height?: string;
  label?: string;
  hint?: string;
  headerActions?: React.ReactNode;
  editorOptions?: EditorProps['options'];
}

const MonacoEditorField: React.FC<MonacoEditorFieldProps> = ({
  value,
  onChange,
  language,
  height = '150px',
  label,
  hint,
  headerActions,
  editorOptions,
}) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const commonOptions: EditorProps['options'] = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
    lineNumbers: 'on',
    folding: true,
    wordWrap: 'on',
    automaticLayout: true,
    padding: { top: 8, bottom: 8 },
    ...editorOptions,
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {label && (
            <label className="text-xs font-medium text-foreground block">
              {label}
            </label>
          )}
          {headerActions}
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover transition-colors"
        >
          <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
          {t('common.expand')}
        </button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      
      <div className="ltr overflow-hidden rounded-md border border-input-border bg-background ring-1 ring-input-border focus-within:ring-primary focus-within:border-primary">
        <Editor
          height={height}
          defaultLanguage={language}
          value={value}
          onChange={(val) => onChange(val || '')}
          theme={isDark ? 'vs-dark' : 'light'}
          options={commonOptions}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={label || t('common.editor')}
        size="4xl"
      >
        <div className="flex flex-col h-[70vh]">
          <div className="flex-1 ltr overflow-hidden rounded-md border border-border">
            <Editor
              height="100%"
              defaultLanguage={language}
              value={value}
              onChange={(val) => onChange(val || '')}
              theme={isDark ? 'vs-dark' : 'light'}
              options={{
                ...commonOptions,
                fontSize: 14,
              }}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              {t('common.done')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MonacoEditorField;
