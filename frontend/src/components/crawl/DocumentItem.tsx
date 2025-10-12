import { Editor } from "@monaco-editor/react";
import { useTranslation } from 'react-i18next';

interface DocumentItemProps {
    content: string;
    documentTitle: string;
    documentUrl: string;
    installCommand: string;
    language: string;
}

export default function DocumentItem({ content, documentTitle, documentUrl, installCommand, language }: DocumentItemProps) {
    const { t } = useTranslation();
    
    return (
        <div>
            <div className="bg-[#23272b] border-b border-[#404040] px-4 py-3 text-gray-200 text-sm">
                <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <span className="font-semibold">{t('api.install')}:</span>
                        <span className="ms-2 font-mono bg-[#181a1b] px-2 py-1 rounded text-green-400">{installCommand}</span>
                    </div>
                    <a
                        href={documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline ms-0 sm:ms-4 mt-2 sm:mt-0"
                    >
                        {documentTitle}
                    </a>
                </div>
                <div className="text-xs text-gray-400">{t('api.seeDocumentation')}</div>
            </div>
            <div className="p-4 font-mono text-sm text-gray-300 overflow-x-auto bg-[#181a1b] rounded-b-lg border-t border-[#404040] mt-0 h-[60vh] ltr">
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