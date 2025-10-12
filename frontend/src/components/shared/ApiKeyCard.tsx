import React from 'react';
import { useTranslation } from 'react-i18next';
import { ApiKey } from '../../types/apiKeys';
import { EyeIcon, EyeSlashIcon, ClipboardDocumentIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useDateLocale } from '../../hooks/useDateLocale';
import { formatDistanceToNowLocalized } from '../../utils/dateUtils';

const maskApiKey = (key: string, visible: boolean) => {
  if (visible) return key;
  const start = key.slice(0, 6);
  const end = key.slice(-4);
  return `${start}${'•'.repeat(20)}${end}`;
};

interface ApiKeyCardProps {
  apiKey: ApiKey;
  isVisible: boolean;
  isCopied: boolean;
  isDeleting: boolean;
  onToggleVisibility: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export const ApiKeyCard: React.FC<ApiKeyCardProps> = ({
  apiKey,
  isVisible,
  isCopied,
  isDeleting,
  onToggleVisibility,
  onCopy,
  onDelete,
}) => {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {apiKey.name}
          </h3>
          <div className="flex items-center gap-x-2">
            <button
              onClick={onToggleVisibility}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
              title={isVisible ? t('apiKeys.hideKey') : t('apiKeys.showKey')}
            >
              {isVisible ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={onCopy}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
              title={t('apiKeys.copyToClipboard')}
            >
              {isCopied ? (
                <CheckIcon className="h-5 w-5 text-green-500" />
              ) : (
                <ClipboardDocumentIcon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className={`text-gray-400 hover:text-red-500 dark:hover:text-red-400 focus:outline-none ${
                isDeleting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={t('apiKeys.deleteKey')}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2 font-mono text-sm text-gray-600 dark:text-gray-300 mb-2">
          {maskApiKey(apiKey.key, isVisible)}
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{t('apiKeys.created')} {formatDistanceToNowLocalized(new Date(apiKey.created_at), dateLocale, { addSuffix: true })}</span>
          <span>
            {apiKey.last_used_at 
              ? `${t('apiKeys.lastUsed')} ${formatDistanceToNowLocalized(new Date(apiKey.last_used_at), dateLocale, { addSuffix: true })}` 
              : t('apiKeys.neverUsed')}
          </span>
        </div>
      </div>
    </div>
  );
};
