import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FeedMessage } from '../../types/feed';

interface FeedProps {
  messages: FeedMessage[];
  title?: string;
  loading?: boolean;
  showTimestamp?: boolean;
  emptyMessage?: string;
  className?: string;
}

const Feed: React.FC<FeedProps> = ({
  messages = [],
  title = 'Engine Feedbacks',
  loading = false,
  showTimestamp = false,
  emptyMessage = 'No feedbacks available',
  className = '',
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when messages change and expanded is true
  useEffect(() => {
    if (expanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, expanded]);

  // Format timestamp to a readable format
  const formatTimestamp = (timestamp: string | Date): string => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get icon based on message type
  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return (
          <span className="text-error">
            <svg
              className="h-3 w-3"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        );
      case 'success':
        return (
          <span className="text-success">
            <svg
              className="h-3 w-3"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        );
      case 'warning':
        return (
          <span className="text-warning">
            <svg
              className="h-3 w-3"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        );
      default:
        return (
          <span className="text-primary">
            <svg
              className="h-3 w-3"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        );
    }
  };

  // Render a single message
  const renderMessage = (message: FeedMessage) => (
    <div
      key={message.id}
      className={`flex items-start rounded border-s-2 px-2 py-1 text-xs ${
        message.type === 'error'
          ? 'border-error bg-error-soft text-error'
          : message.type === 'success'
            ? 'border-success bg-success-soft text-success-strong'
            : message.type === 'warning'
              ? 'border-warning bg-warning-soft text-warning-strong'
              : 'border-primary bg-primary-soft text-foreground'
      }`}
    >
      <div className="me-2 mt-0.5 flex-shrink-0">{getIcon(message.type)}</div>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div className="break-words">{message.message}</div>
          {showTimestamp && message.timestamp && (
            <div className="ms-2 shrink-0 text-xs text-muted-foreground">
              {formatTimestamp(message.timestamp)}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Get the latest message if it exists
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  return (
    <div className={`rounded-lg border border-border bg-card shadow ${className} ltr`}>
      {/* Header with title and toggle button */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="flex items-center text-xs font-medium text-foreground">
          <span>{title}</span>
          {loading && (
            <div className="ms-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-input-border border-t-primary-500" />
          )}
          {messages.length > 0 && (
            <span className="ms-2 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {messages.length}
            </span>
          )}
        </h3>
        <button
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="rounded px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-muted hover:text-primary-strong focus:outline-none"
        >
          {expanded ? t('feed.showLatest') : t('feed.showTrace')}
        </button>
      </div>

      {/* Content area */}
      <div className="overflow-hidden">
        <div
          className={`px-3 py-2 transition-all duration-300 ease-in-out ${expanded ? 'max-h-96 overflow-y-auto' : ''}`}
        >
          {!latestMessage ? (
            <div className="py-1 text-center text-xs text-muted-foreground">{emptyMessage}</div>
          ) : expanded ? (
            <div className="space-y-1">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <>
              {messages.filter(message => message.type === 'error').map(renderMessage)}
              {latestMessage.type !== 'error' && renderMessage(latestMessage)}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feed;
