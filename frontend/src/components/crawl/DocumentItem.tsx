import { useTranslation } from 'react-i18next';

import { Editor } from '@monaco-editor/react';

import { useTheme } from '../../contexts/ThemeContext';

interface DocumentItemProps {
  content: string;
  documentTitle: string;
  documentUrl: string;
  installCommand: string;
  language: string;
}

export default function DocumentItem({
  content,
  documentTitle,
  documentUrl,
  installCommand,
  language,
}: DocumentItemProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  return (
    <div>
      <div className="border-b border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
        <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-semibold">{t('api.install')}:</span>
            <span className="ms-2 rounded bg-card px-2 py-1 font-mono text-success">
              {installCommand}
            </span>
          </div>
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ms-0 mt-2 text-primary underline sm:ms-4 sm:mt-0"
          >
            {documentTitle}
          </a>
        </div>
        <div className="text-xs text-muted-foreground">{t('api.seeDocumentation')}</div>
      </div>
      <div className="ltr mt-0 h-[60vh] overflow-x-auto rounded-b-lg border-t border-border bg-card p-4 font-mono text-sm text-muted-foreground">
        <Editor
          height="100%"
          defaultLanguage={language}
          value={content}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
          }}
          theme={isDark ? 'vs-dark' : 'light'}
        />
      </div>
    </div>
  );
}
