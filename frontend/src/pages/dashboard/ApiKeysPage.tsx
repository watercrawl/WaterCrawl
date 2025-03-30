import React, { useState, useEffect, Fragment } from 'react';
import { 
  PlusIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { formatDistanceToNow } from 'date-fns';
import { apiKeysApi } from '../../services/api/apiKeys';
import { ApiKey } from '../../types/apiKeys';
import { toast } from 'react-hot-toast';
import { Pagination } from '../../components/shared/Pagination';
import { useIsTabletOrMobile } from '../../hooks/useMediaQuery';
import { ApiKeyCard } from '../../components/shared/ApiKeyCard';

const ApiKeysPage: React.FC = () => {
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

  const fetchApiKeys = async (page: number) => {
    try {
      setLoading(true);
      const data = await apiKeysApi.list(page);
      setApiKeys(data.results);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys(currentPage);
  }, [currentPage]);

  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }
    try {
      const newKey = await apiKeysApi.create(newKeyName);
      setApiKeys(prev => [newKey, ...prev]);
      setNewKeyName('');
      setIsModalOpen(false);
      toast.success('API key created successfully');
      // Show the new key immediately
      setVisibleKeys(prev => ({ ...prev, [newKey.uuid]: true }));
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    }
  };

  const deleteApiKey = async (uuid: string) => {
    try {
      setDeletingKey(uuid);
      await apiKeysApi.delete(uuid);
      setApiKeys(prev => prev.filter(key => key.uuid !== uuid));
      toast.success('API key deleted successfully');
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
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
      toast.success('API key copied to clipboard');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy API key');
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
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">API Keys</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Manage your API keys for accessing the WaterCrawl API. Keep your keys secure and never share them publicly.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New API Key
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">No API keys found</p>
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
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                              Name
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                              API Key
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                              Created
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                              Last Used
                            </th>
                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                          {apiKeys.map((apiKey) => (
                            <tr key={apiKey.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                                {apiKey.name}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                                <div className="flex items-center space-x-2">
                                  <span className="flex-1">{maskApiKey(apiKey.key, visibleKeys[apiKey.uuid])}</span>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(apiKey.created_at), { addSuffix: true })}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                {apiKey.last_used_at 
                                  ? formatDistanceToNow(new Date(apiKey.last_used_at), { addSuffix: true })
                                  : 'Never used'}
                              </td>
                              <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <div className="flex justify-end space-x-3">
                                  <button
                                    onClick={() => toggleKeyVisibility(apiKey.uuid)}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                                    title={visibleKeys[apiKey.uuid] ? "Hide API Key" : "Show API Key"}
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
                                    title="Copy to Clipboard"
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
                                    title="Delete API Key"
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
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                    >
                      Create New API Key
                    </Dialog.Title>
                    <form onSubmit={createApiKey}>
                      <div className="mt-4">
                        <label htmlFor="key-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Key Name
                        </label>
                        <input
                          type="text"
                          name="key-name"
                          id="key-name"
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                          placeholder="Enter a name for your API key"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          onClick={() => setIsModalOpen(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Create
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
