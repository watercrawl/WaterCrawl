import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

import { useDateLocale } from '../../hooks/useDateLocale';
import { ApiKey } from '../../types/apiKeys';
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
    <div className="overflow-hidden rounded-lg bg-card shadow">
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">{apiKey.name}</h3>
          <div className="flex items-center gap-x-2">
            <button
              onClick={onToggleVisibility}
              className="text-muted-foreground hover:text-muted-foreground focus:outline-none"
              title={isVisible ? t('apiKeys.hideKey') : t('apiKeys.showKey')}
            >
              {isVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
            <button
              onClick={onCopy}
              className="text-muted-foreground hover:text-muted-foreground focus:outline-none"
              title={t('apiKeys.copyToClipboard')}
            >
              {isCopied ? (
                <CheckIcon className="h-5 w-5 text-success" />
              ) : (
                <ClipboardDocumentIcon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className={`text-muted-foreground hover:text-error focus:outline-none ${
                isDeleting ? 'cursor-not-allowed opacity-50' : ''
              }`}
              title={t('apiKeys.deleteKey')}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="mb-2 rounded bg-muted p-2 font-mono text-sm text-muted-foreground">
          {maskApiKey(apiKey.key, isVisible)}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {t('apiKeys.created')}{' '}
            {formatDistanceToNowLocalized(new Date(apiKey.created_at), dateLocale, {
              addSuffix: true,
            })}
          </span>
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
