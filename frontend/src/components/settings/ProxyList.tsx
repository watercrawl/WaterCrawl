import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Proxy } from '../../types/proxy';
import { Pagination } from '../../components/shared/Pagination';

interface ProxyListProps {
  proxies: Proxy[];
  currentPage: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
  loading: boolean;
  deletingSlug: string | null;
  isTabletOrMobile: boolean;
  onPageChange: (page: number) => void;
  onEdit: (proxy: Proxy) => void;
  onDelete: (slug: string) => void;
}

// Card view for mobile
const ProxyCard: React.FC<{
  proxy: Proxy;
  onEdit: (proxy: Proxy) => void;
  onDelete: (slug: string) => void;
  isDeleting: boolean;
}> = ({ proxy, onEdit, onDelete, isDeleting }) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-md">
      <div className="p-4">
        <div className="flex justify-between">
          <div className="font-medium text-gray-900 dark:text-white flex items-center">
            {proxy.name}
            {proxy.is_default && (
              <span className="ml-2 text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                Default
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(proxy)}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(proxy.slug)}
              disabled={isDeleting}
              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <TrashIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-1">
            <span className="font-medium">Connection: </span>
            {proxy.proxy_type}://{proxy.host}:{proxy.port}
          </p>
          <p className="mb-1">
            <span className="font-medium">Username: </span>
            {proxy.username}
          </p>
          <p>
            <span className="font-medium">Created: </span>
            {new Date(proxy.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

const ProxyList: React.FC<ProxyListProps> = ({
  proxies,
  currentPage,
  totalItems,
  hasNext,
  hasPrevious,
  loading,
  deletingSlug,
  isTabletOrMobile,
  onPageChange,
  onEdit,
  onDelete
}) => {
  if (loading && proxies.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading proxy servers...</p>
        </div>
      </div>
    );
  }

  if (proxies.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 shadow rounded-lg">
        <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No proxy servers found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating a new proxy server.
        </p>
      </div>
    );
  }

  return (
    <>
      {isTabletOrMobile ? (
        <div className="space-y-4">
          {proxies.map((proxy) => (
            <ProxyCard
              key={proxy.slug}
              proxy={proxy}
              onEdit={onEdit}
              onDelete={onDelete}
              isDeleting={deletingSlug === proxy.slug}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                  Name
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Type
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Host
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Port
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Username
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Created
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {proxies.map((proxy) => (
                <tr key={proxy.slug} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                    {proxy.name}
                    {proxy.is_default && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        Default
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {proxy.proxy_type}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {proxy.host}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {proxy.port}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {proxy.username}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(proxy.created_at).toLocaleDateString()}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => onEdit(proxy)}
                        className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 focus:outline-none"
                        title="Edit proxy"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onDelete(proxy.slug)}
                        disabled={deletingSlug === proxy.slug}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 focus:outline-none"
                        title="Delete proxy"
                      >
                        {deletingSlug === proxy.slug ? (
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <TrashIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          hasNextPage={hasNext}
          hasPreviousPage={hasPrevious}
          onPageChange={onPageChange}
          loading={loading}
        />
      </div>
    </>
  );
};

export default ProxyList;
