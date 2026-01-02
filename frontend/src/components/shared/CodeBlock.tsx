import React, { useState, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface CodeBlockProps {
  /** The code content to display */
  content: string | Record<string, unknown>;
  /** Optional language for syntax highlighting label */
  language?: string;
  /** Maximum height of the code block */
  maxHeight?: string;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Custom className for the container */
  className?: string;
  /** Text size - defaults to 'xs' */
  textSize?: 'xs' | 'sm' | 'base';
}

/**
 * CodeBlock component - Displays code with LTR direction and copy button
 * Used for displaying JSON, code snippets, tool outputs, etc.
 */
const CodeBlock: React.FC<CodeBlockProps> = ({
  content,
  language,
  maxHeight = 'max-h-64',
  showLineNumbers = false,
  className = '',
  textSize = 'xs',
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // Format content as string
  const formattedContent = useMemo(() => {
    if (typeof content === 'string') {
      return content;
    }
    return JSON.stringify(content, null, 2);
  }, [content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const textSizeClass = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
  }[textSize];

  return (
    <div className={`relative rounded-md border border-border overflow-hidden ${className}`} dir="ltr">
      {/* Header with language label and copy button */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border">
        <span className="text-[10px] font-mono text-muted-foreground uppercase">
          {language || 'json'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title={t('common.copy')}
        >
          {copied ? (
            <>
              <CheckIcon className="h-3 w-3 text-success" />
              <span>{t('common.copied')}</span>
            </>
          ) : (
            <>
              <ClipboardDocumentIcon className="h-3 w-3" />
              <span>{t('common.copy')}</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className={`bg-background p-3 overflow-x-auto overflow-y-auto ${maxHeight}`}>
        <pre className={`${textSizeClass} font-mono text-foreground whitespace-pre-wrap break-words`}>
          {showLineNumbers ? (
            formattedContent.split('\n').map((line, index) => (
              <div key={index} className="flex">
                <span className="select-none text-muted-foreground w-8 text-right pr-3 flex-shrink-0">
                  {index + 1}
                </span>
                <code>{line}</code>
              </div>
            ))
          ) : (
            <code>{formattedContent}</code>
          )}
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
