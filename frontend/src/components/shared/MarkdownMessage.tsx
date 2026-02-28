import React, { useState } from 'react';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

interface MarkdownMessageProps {
  content: string;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
}

/**
 * Enhanced markdown renderer component for chat messages
 * Features:
 * - GFM (GitHub Flavored Markdown) support
 * - Syntax highlighting with copy button
 * - Math equations (LaTeX)
 * - Task lists
 * - Tables with better styling
 * - Images with lazy loading
 * - Dark/light theme support
 */
const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, className = '', theme = 'auto' }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Detect system theme
  const isDarkMode = theme === 'auto' 
    ? window.matchMedia('(prefers-color-scheme: dark)').matches 
    : theme === 'dark';

  const codeStyle = isDarkMode ? oneDark : oneLight;

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Code blocks with syntax highlighting and copy button
          code({ node: _node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');
            const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
            const isInline = !className;

            if (!isInline && language) {
              return (
                <div className="relative rounded-lg overflow-hidden my-4 group">
                  {/* Header with language and copy button */}
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
                    <span className="text-xs font-mono text-muted-foreground uppercase">
                      {language}
                    </span>
                    <button
                      onClick={() => copyToClipboard(codeString, codeId)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-background hover:bg-muted text-foreground transition-colors"
                      title="Copy code"
                    >
                      {copiedCode === codeId ? (
                        <>
                          <CheckIcon className="h-3.5 w-3.5 text-success" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Code content */}
                  <SyntaxHighlighter
                    style={codeStyle as { [key: string]: React.CSSProperties }}
                    language={language}
                    PreTag="div"
                    showLineNumbers={codeString.split('\n').length > 3}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      fontSize: '0.813rem',
                      lineHeight: '1.5',
                      backgroundColor: isDarkMode ? 'rgb(40, 44, 52)' : 'rgb(250, 250, 250)',
                    }}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }

            // Inline code
            return (
              <code
                className="px-1.5 py-0.5 rounded bg-muted/80 text-foreground font-mono text-[0.85em] border border-border/50"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Links
          a({ node: _node, children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-hover underline transition-colors"
                {...props}
              >
                {children}
              </a>
            );
          },
          // Headings
          h1({ node: _node, children, ...props }) {
            return (
              <h1 className="text-2xl font-bold text-foreground mt-6 mb-4" {...props}>
                {children}
              </h1>
            );
          },
          h2({ node: _node, children, ...props }) {
            return (
              <h2 className="text-xl font-semibold text-foreground mt-5 mb-3" {...props}>
                {children}
              </h2>
            );
          },
          h3({ node: _node, children, ...props }) {
            return (
              <h3 className="text-lg font-semibold text-foreground mt-4 mb-2" {...props}>
                {children}
              </h3>
            );
          },
          // Paragraphs
          p({ node: _node, children, ...props }) {
            return (
              <p className="text-foreground leading-relaxed my-1" {...props}>
                {children}
              </p>
            );
          },
          // Lists with better indentation
          ul({ node, children, ...props }) {
            const isTaskList = node?.children?.some(
              (child: any) => child.type === 'element' && child.tagName === 'li' && child.properties?.className?.includes('task-list-item')
            );
            
            return (
              <ul 
                className={`space-y-2 mb-4 text-foreground ${
                  isTaskList ? 'list-none' : 'list-disc ps-6 marker:text-primary'
                }`}
                {...props}
              >
                {children}
              </ul>
            );
          },
          ol({ node: _node, children, ...props }) {
            return (
              <ol className="list-decimal ps-6 space-y-2 mb-4 text-foreground marker:text-primary marker:font-semibold" {...props}>
                {children}
              </ol>
            );
          },
          li({ node: _node, children, ...props }) {
            const isTaskListItem = props.className?.includes('task-list-item');
            
            return (
              <li 
                className={`text-foreground leading-relaxed ${
                  isTaskListItem ? 'flex items-start gap-2' : ''
                }`}
                {...props}
              >
                {children}
              </li>
            );
          },
          // Blockquotes
          blockquote({ node: _node, children, ...props }) {
            return (
              <blockquote
                className="border-s-4 border-primary ps-4 py-2 my-4 italic text-muted-foreground bg-muted/30 rounded-e"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          // Tables with better styling
          table({ node: _node, children, ...props }) {
            return (
              <div className="overflow-x-auto my-6 rounded-lg border border-border shadow-sm">
                <table className="min-w-full divide-y divide-border" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          thead({ node: _node, children, ...props }) {
            return (
              <thead className="bg-muted/50" {...props}>
                {children}
              </thead>
            );
          },
          tbody({ node: _node, children, ...props }) {
            return (
              <tbody className="divide-y divide-border bg-background" {...props}>
                {children}
              </tbody>
            );
          },
          tr({ node: _node, children, ...props }) {
            return (
              <tr className="hover:bg-muted/30 transition-colors" {...props}>
                {children}
              </tr>
            );
          },
          th({ node: _node, children, ...props }) {
            return (
              <th className="px-4 py-3 text-start text-xs font-semibold text-foreground uppercase tracking-wider" {...props}>
                {children}
              </th>
            );
          },
          td({ node: _node, children, ...props }) {
            return (
              <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap" {...props}>
                {children}
              </td>
            );
          },
          // Images with lazy loading and error handling
          img({ node: _node, src, alt, ...props }) {
            return (
              <div className="my-4">
                <img
                  src={src}
                  alt={alt || 'Image'}
                  loading="lazy"
                  className="rounded-lg border border-border max-w-full h-auto shadow-sm hover:shadow-md transition-shadow"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="flex items-center justify-center p-4 bg-muted/30 border border-border rounded-lg text-muted-foreground text-sm">
                        <span>Failed to load image: ${alt || 'Image'}</span>
                      </div>`;
                    }
                  }}
                  {...props}
                />
                {alt && (
                  <p className="mt-2 text-xs text-center text-muted-foreground italic">
                    {alt}
                  </p>
                )}
              </div>
            );
          },
          // Horizontal rule
          hr({ node: _node, ...props }) {
            return <hr className="my-6 border-t border-border" {...props} />;
          },
          // Strong/Bold
          strong({ node: _node, children, ...props }) {
            return (
              <strong className="font-semibold text-foreground" {...props}>
                {children}
              </strong>
            );
          },
          // Emphasis/Italic
          em({ node: _node, children, ...props }) {
            return (
              <em className="italic text-foreground" {...props}>
                {children}
              </em>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;
