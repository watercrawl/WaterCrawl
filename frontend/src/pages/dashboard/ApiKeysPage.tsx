import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { 
  PlusIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { apiKeysApi } from '../../services/api/apiKeys';
import { ApiKey } from '../../types/apiKeys';
import { toast } from 'react-hot-toast';
import { Pagination } from '../../components/shared/Pagination';
import { useIsTabletOrMobile } from '../../hooks/useMediaQuery';
import { ApiKeyCard } from '../../components/shared/ApiKeyCard';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '../../hooks/useDateLocale';
import { formatDistanceToNowLocalized } from '../../utils/dateUtils';

const ApiKeysPage: React.FC = () => {
  const { t } = useTranslation();
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
      { label: t('dashboard.title'), href: '/dashboard'},
      { label: t('apiKeys.title'), href: '/dashboard/api-keys', current: true },
    ]);
  }, [setItems, t]);

  const fetchApiKeys = useCallback(async (page: number) => {
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
  }, [t]);

  useEffect(() => {
    fetchApiKeys(currentPage);
  }, [currentPage,fetchApiKeys]);

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

  const deleteApiKey = async (uuid: string) => {
    try {
      setDeletingKey(uuid);
      await apiKeysApi.delete(uuid);
      setApiKeys(prev => prev.filter(key => key.uuid !== uuid));
      toast.success(t('apiKeys.messages.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error(t('apiKeys.messages.deleteFailed'));
    } finally {
      setDeletingKey(null);
    }
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
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('apiKeys.title')}</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('apiKeys.subtitle')}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ms-16 sm:flex-none">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <PlusIcon className="h-4 w-4 me-2" />
              {t('apiKeys.createNew')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('apiKeys.noKeys')}</p>
          </div>
        ) : (
          <>
            {isTabletOrMobile ? (
              <div className="mt-8 space-y-4">
                {apiKeys.map((apiKey) => (
                  <ApiKeyCard
                    key={apiKey.uuid}
                    apiKey={apiKey}
                    isVisible={visibleKeys[apiKey.uuid] || false}
                    isCopied={copiedKey === apiKey.uuid}
                    isDeleting={deletingKey === apiKey.uuid}
                    onToggleVisibility={() => toggleKeyVisibility(apiKey.uuid)}
                    onCopy={() => copyToClipboard(apiKey.key, apiKey.uuid)}
                    onDelete={() => deleteApiKey(apiKey.uuid)}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8 flex flex-col">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-gray-700 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th scope="col" className="py-3.5 ps-4 pe-3 text-start text-sm font-semibold text-gray-900 dark:text-white sm:ps-6">
                              {t('apiKeys.table.name')}
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-white">
                              {t('apiKeys.table.apiKey')}
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-white">
                              {t('apiKeys.table.created')}
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-white">
                              {t('apiKeys.table.lastUsed')}
                            </th>
                            <th scope="col" className="relative py-3.5 ps-3 pe-4 sm:pe-6">
                              <span className="sr-only">{t('common.actions')}</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                          {apiKeys.map((apiKey) => (
                            <tr key={apiKey.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                              <td className="whitespace-nowrap py-4 ps-4 pe-3 text-sm font-medium text-gray-900 dark:text-white sm:ps-6">
                                {apiKey.name}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                                <div className="flex items-center gap-x-2">
                                  <span className="flex-1">{maskApiKey(apiKey.key, visibleKeys[apiKey.uuid])}</span>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                {formatDistanceToNowLocalized(new Date(apiKey.created_at), dateLocale, { addSuffix: true })}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                {apiKey.last_used_at 
                                  ? formatDistanceToNowLocalized(new Date(apiKey.last_used_at), dateLocale, { addSuffix: true })
                                  : t('apiKeys.neverUsed')}
                              </td>
                              <td className="whitespace-nowrap py-4 ps-3 pe-4 text-end text-sm font-medium sm:pe-6">
                                <div className="flex justify-end gap-x-3">
                                  <button
                                    onClick={() => toggleKeyVisibility(apiKey.uuid)}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                                    title={visibleKeys[apiKey.uuid] ? t('apiKeys.hideKey') : t('apiKeys.showKey')}
                                  >
                                    {visibleKeys[apiKey.uuid] ? (
                                      <EyeSlashIcon className="h-5 w-5" />
                                    ) : (
                                      <EyeIcon className="h-5 w-5" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(apiKey.key, apiKey.uuid)}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                                    title={t('apiKeys.copyToClipboard')}
                                  >
                                    {copiedKey === apiKey.uuid ? (
                                      <CheckIcon className="h-5 w-5 text-green-500" />
                                    ) : (
                                      <ClipboardDocumentIcon className="h-5 w-5" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => deleteApiKey(apiKey.uuid)}
                                    disabled={deletingKey === apiKey.uuid}
                                    className={`text-gray-400 hover:text-red-500 dark:hover:text-red-400 focus:outline-none ${
                                      deletingKey === apiKey.uuid ? 'opacity-50 cursor-not-allowed' : ''
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
              <div className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-50" />
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
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-start align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                    >
                      {t('apiKeys.createNew')}
                    </Dialog.Title>
                    <form onSubmit={createApiKey}>
                      <div className="mt-4">
                        <label htmlFor="key-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('apiKeys.keyName')}
                        </label>
                        <input
                          type="text"
                          name="key-name"
                          id="key-name"
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          placeholder={t('apiKeys.keyNamePlaceholder')}
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="mt-6 flex justify-end gap-x-3">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          onClick={() => setIsModalOpen(false)}
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
