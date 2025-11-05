import React, { useState, useEffect, Fragment, useCallback } from 'react';

import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { Dialog, Transition } from '@headlessui/react';
import {
  PlusIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

import { ApiKeyCard } from '../../components/shared/ApiKeyCard';
import { Input } from '../../components/shared/Input';
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
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-foreground">{t('apiKeys.title')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('apiKeys.subtitle')}</p>
          </div>
          <div className="mt-4 sm:ms-16 sm:mt-0 sm:flex-none">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <PlusIcon className="me-2 h-4 w-4" />
              {t('apiKeys.createNew')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">{t('apiKeys.noKeys')}</p>
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
              <div className="mt-8 flex flex-col">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full px-4 py-2 align-middle sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg shadow ring-1 ring-black ring-opacity-5">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted">
                          <tr>
                            <th
                              scope="col"
                              className="py-3.5 pe-3 ps-4 text-start text-sm font-semibold text-foreground sm:ps-6"
                            >
                              {t('apiKeys.table.name')}
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                            >
                              {t('apiKeys.table.apiKey')}
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                            >
                              {t('apiKeys.table.created')}
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                            >
                              {t('apiKeys.table.lastUsed')}
                            </th>
                            <th scope="col" className="relative py-3.5 pe-4 ps-3 sm:pe-6">
                              <span className="sr-only">{t('common.actions')}</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                          {apiKeys.map(apiKey => (
                            <tr
                              key={apiKey.uuid}
                              className="transition-colors duration-200 hover:bg-muted"
                            >
                              <td className="whitespace-nowrap py-4 pe-3 ps-4 text-sm font-medium text-foreground sm:ps-6">
                                {apiKey.name}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 font-mono text-sm text-muted-foreground">
                                <div className="flex items-center gap-x-2">
                                  <span className="flex-1">
                                    {maskApiKey(apiKey.key, visibleKeys[apiKey.uuid])}
                                  </span>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                {formatDistanceToNowLocalized(
                                  new Date(apiKey.created_at),
                                  dateLocale,
                                  { addSuffix: true }
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                {apiKey.last_used_at
                                  ? formatDistanceToNowLocalized(
                                      new Date(apiKey.last_used_at),
                                      dateLocale,
                                      { addSuffix: true }
                                    )
                                  : t('apiKeys.neverUsed')}
                              </td>
                              <td className="whitespace-nowrap py-4 pe-4 ps-3 text-end text-sm font-medium sm:pe-6">
                                <div className="flex justify-end gap-x-3">
                                  <button
                                    onClick={() => toggleKeyVisibility(apiKey.uuid)}
                                    className="text-muted-foreground hover:text-muted-foreground focus:outline-none"
                                    title={
                                      visibleKeys[apiKey.uuid]
                                        ? t('apiKeys.hideKey')
                                        : t('apiKeys.showKey')
                                    }
                                  >
                                    {visibleKeys[apiKey.uuid] ? (
                                      <EyeSlashIcon className="h-5 w-5" />
                                    ) : (
                                      <EyeIcon className="h-5 w-5" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(apiKey.key, apiKey.uuid)}
                                    className="text-muted-foreground hover:text-muted-foreground focus:outline-none"
                                    title={t('apiKeys.copyToClipboard')}
                                  >
                                    {copiedKey === apiKey.uuid ? (
                                      <CheckIcon className="h-5 w-5 text-success" />
                                    ) : (
                                      <ClipboardDocumentIcon className="h-5 w-5" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteApiKey(apiKey)}
                                    disabled={deletingKey === apiKey.uuid}
                                    className={`text-muted-foreground hover:text-error focus:outline-none ${
                                      deletingKey === apiKey.uuid
                                        ? 'cursor-not-allowed opacity-50'
                                        : ''
                                    }`}
                                    title={t('apiKeys.deleteKey')}
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
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

        <Transition appear show={isModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-card p-6 text-start align-middle shadow-xl transition-all">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-foreground">
                      {t('apiKeys.createNew')}
                    </Dialog.Title>
                    <form onSubmit={createApiKey}>
                      <div className="mt-4">
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
                      </div>

                      <div className="mt-6 flex justify-end gap-x-3">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-input-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          onClick={() => setIsModalOpen(false)}
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                          {t('common.submit')}
                        </button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
};

export default ApiKeysPage;
