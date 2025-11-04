import { Editor } from '@monaco-editor/react';
import { useTranslation } from 'react-i18next';

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

  return (
    <div>
      <div className="border-b border-[#404040] bg-[#23272b] px-4 py-3 text-sm text-muted-foreground">
        <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-semibold">{t('api.install')}:</span>
            <span className="ms-2 rounded bg-[#181a1b] px-2 py-1 font-mono text-success">
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
      <div className="ltr mt-0 h-[60vh] overflow-x-auto rounded-b-lg border-t border-[#404040] bg-[#181a1b] p-4 font-mono text-sm text-muted-foreground">
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
          theme="vs-dark"
        />
      </div>
    </div>
  );
}
