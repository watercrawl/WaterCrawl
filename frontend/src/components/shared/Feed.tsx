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
                    <span className="text-red-500">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </span>
                );
            case 'success':
                return (
                    <span className="text-green-500">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </span>
                );
            case 'warning':
                return (
                    <span className="text-yellow-500">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </span>
                );
            default:
                return (
                    <span className="text-blue-500">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </span>
                );
        }
    };

    // Render a single message
    const renderMessage = (message: FeedMessage) => (
        <div
            key={message.id}
            className={`flex items-start py-1 text-xs border-s-2 px-2 rounded ${message.type === 'error'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400'
                : message.type === 'success'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400'
                    : message.type === 'warning'
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400'
                        : 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 text-gray-700 dark:text-gray-300'}`}
        >
            <div className="flex-shrink-0 me-2 mt-0.5">
                {getIcon(message.type)}
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div className="break-words">{message.message}</div>
                    {showTimestamp && message.timestamp && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 ms-2 shrink-0">
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
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 ${className} ltr`}>
            {/* Header with title and toggle button */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <span>{title}</span>
                    {loading && (
                        <div className="ms-2 animate-spin inline-block w-3 h-3 border-2 border-gray-300 border-t-primary-500 rounded-full" />
                    )}
                    {messages.length > 0 && (
                        <span className="ms-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                            {messages.length}
                        </span>
                    )}
                </h3>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setExpanded(!expanded);
                    }}
                    className="text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium focus:outline-none transition-colors px-2 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    {expanded ? t('feed.showLatest') : t('feed.showTrace')}
                </button>
            </div>

            {/* Content area */}
            <div className="overflow-hidden">
                <div className={`transition-all duration-300 ease-in-out px-3 py-2 ${expanded ? 'max-h-96 overflow-y-auto' : ''}`}>
                    {!latestMessage ? (
                        <div className="py-1 text-center text-gray-500 dark:text-gray-400 text-xs">
                            {emptyMessage}
                        </div>
                    ) : expanded ? (
                        <div className="space-y-1">
                            {messages.map(renderMessage)}
                            <div ref={messagesEndRef} />
                        </div>
                    ) : (
                        <>
                            {messages.filter((message) => message.type === 'error').map(renderMessage)}
                            {latestMessage.type !== 'error' && renderMessage(latestMessage)}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Feed;