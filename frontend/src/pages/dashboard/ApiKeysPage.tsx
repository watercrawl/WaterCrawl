import React, { useState, useEffect, useCallback } from 'react';

import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import {
  PlusIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

import { ApiKeyCard } from '../../components/shared/ApiKeyCard';
import { Input } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import PageHeader from '../../components/shared/PageHeader';
import { Pagination } from '../../components/shared/Pagination';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useDateLocale } from '../../hooks/useDateLocale';
import { useIsTabletOrMobile } from '../../hooks/useMediaQuery';
import { apiKeysApi } from '../../services/api/apiKeys';
import { ApiKey } from '../../types/apiKeys';
import { formatDistanceToNowLocalized } from '../../utils/dateUtils';

const ApiKeysPage: React.FC = () => {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const dateLocale = useDateLocale();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newKeyName, setNewKeyName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<{ [key: string]: boolean }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const isTabletOrMobile = useIsTabletOrMobile();
  const { setItems } = useBreadcrumbs();

  useEffect(() => {
    setItems([
      { label: t('dashboard.title'), href: '/dashboard' },
      { label: t('apiKeys.title'), href: '/dashboard/api-keys', current: true },
    ]);
  }, [setItems, t]);

  const fetchApiKeys = useCallback(
    async (page: number) => {
      try {
        setLoading(true);
        const data = await apiKeysApi.list(page);
        setApiKeys(data.results);
        setTotalPages(Math.ceil(data.count / 10));
      } catch (error) {
        console.error('Error fetching API keys:', error);
        toast.error(t('apiKeys.messages.fetchFailed'));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    fetchApiKeys(currentPage);
  }, [currentPage, fetchApiKeys]);

  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast.error(t('apiKeys.messages.enterName'));
      return;
    }
    try {
      const newKey = await apiKeysApi.create(newKeyName);
      setApiKeys(prev => [newKey, ...prev]);
      setNewKeyName('');
      setIsModalOpen(false);
      toast.success(t('apiKeys.messages.createSuccess'));
      // Show the new key immediately
      setVisibleKeys(prev => ({ ...prev, [newKey.uuid]: true }));
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error(t('apiKeys.messages.createFailed'));
    }
  };

  const handleDeleteApiKey = (apiKey: ApiKey) => {
    confirm({
      title: t('apiKeys.deleteConfirmTitle'),
      message: t('apiKeys.deleteConfirmMessage', { name: apiKey.name }),
      warningMessage: t('apiKeys.deleteWarning'),
      variant: 'danger',
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        try {
          setDeletingKey(apiKey.uuid);
          await apiKeysApi.delete(apiKey.uuid);
          setApiKeys(prev => prev.filter(key => key.uuid !== apiKey.uuid));
          toast.success(t('apiKeys.messages.deleteSuccess'));
        } catch (error) {
          console.error('Error deleting API key:', error);
          toast.error(t('apiKeys.messages.deleteFailed'));
        } finally {
          setDeletingKey(null);
        }
      },
    });
  };

  const toggleKeyVisibility = (keyPk: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyPk]: !prev[keyPk],
    }));
  };

  const copyToClipboard = async (key: string, keyPk: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(keyPk);
      toast.success(t('toasts.success.copied'));
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error(t('apiKeys.messages.copyFailed'));
    }
  };

  const maskApiKey = (key: string, isVisible: boolean) => {
    if (isVisible) return key;
    return `${key.slice(0, 8)}${'•'.repeat(24)}${key.slice(-8)}`;
  };

  return (
    <div className="h-full">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <PageHeader
            titleKey="apiKeys.title"
            descriptionKey="apiKeys.subtitle"
            actions={
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>{t('apiKeys.createNew')}</span>
              </button>
            }
          />
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            </div>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
            <div className="text-center">
              <PlusIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">{t('apiKeys.noKeys')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t('apiKeys.createFirstKey')}</p>
            </div>
          </div>
        ) : (
          <>
            {isTabletOrMobile ? (
              <div className="mt-8 space-y-4">
                {apiKeys.map(apiKey => (
                  <ApiKeyCard
                    key={apiKey.uuid}
                    apiKey={apiKey}
                    isVisible={visibleKeys[apiKey.uuid] || false}
                    isCopied={copiedKey === apiKey.uuid}
                    isDeleting={deletingKey === apiKey.uuid}
                    onToggleVisibility={() => toggleKeyVisibility(apiKey.uuid)}
                    onCopy={() => copyToClipboard(apiKey.key, apiKey.uuid)}
                    onDelete={() => handleDeleteApiKey(apiKey)}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/30">
                    <tr>
                      <th
                        scope="col"
                        className="py-3 pe-3 ps-6 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {t('apiKeys.table.name')}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {t('apiKeys.table.apiKey')}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {t('apiKeys.table.created')}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {t('apiKeys.table.lastUsed')}
                      </th>
                      <th scope="col" className="relative py-3 pe-6 ps-3">
                        <span className="sr-only">{t('common.actions')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 bg-card">
                    {apiKeys.map(apiKey => (
                      <tr
                        key={apiKey.uuid}
                        className="transition-colors duration-150 hover:bg-muted/30"
                      >
                        <td className="whitespace-nowrap py-3.5 pe-3 ps-6 text-sm font-medium text-foreground">
                          {apiKey.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 font-mono text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="flex-1">
                              {maskApiKey(apiKey.key, visibleKeys[apiKey.uuid])}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-sm text-muted-foreground">
                          {formatDistanceToNowLocalized(new Date(apiKey.created_at), dateLocale, {
                            addSuffix: true,
                          })}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-sm text-muted-foreground">
                          {apiKey.last_used_at
                            ? formatDistanceToNowLocalized(
                                new Date(apiKey.last_used_at),
                                dateLocale,
                                { addSuffix: true }
                              )
                            : t('apiKeys.neverUsed')}
                        </td>
                        <td className="whitespace-nowrap py-3.5 pe-6 ps-3 text-end text-sm">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => toggleKeyVisibility(apiKey.uuid)}
                              className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                              title={
                                visibleKeys[apiKey.uuid]
                                  ? t('apiKeys.hideKey')
                                  : t('apiKeys.showKey')
                              }
                            >
                              {visibleKeys[apiKey.uuid] ? (
                                <EyeSlashIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(apiKey.key, apiKey.uuid)}
                              className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                              title={t('apiKeys.copyToClipboard')}
                            >
                              {copiedKey === apiKey.uuid ? (
                                <CheckIcon className="h-4 w-4 text-success" />
                              ) : (
                                <ClipboardDocumentIcon className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteApiKey(apiKey)}
                              disabled={deletingKey === apiKey.uuid}
                              className={`rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-error/10 hover:text-error ${
                                deletingKey === apiKey.uuid ? 'cursor-not-allowed opacity-50' : ''
                              }`}
                              title={t('apiKeys.deleteKey')}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalItems={apiKeys.length}
                hasNextPage={currentPage < totalPages}
                hasPreviousPage={currentPage > 1}
                onPageChange={setCurrentPage}
                loading={loading}
              />
            )}
          </>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={t('apiKeys.createNew')}
          icon={KeyIcon}
          size="md"
          footer={
            <>
              <button
                type="button"
                className="inline-flex justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={() => setIsModalOpen(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                form="create-key-form"
                className="inline-flex justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {t('common.submit')}
              </button>
            </>
          }
        >
          <form id="create-key-form" onSubmit={createApiKey}>
            <Input
              label={t('apiKeys.keyName')}
              type="text"
              name="key-name"
              id="key-name"
              placeholder={t('apiKeys.keyNamePlaceholder')}
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              required
            />
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default ApiKeysPage;
