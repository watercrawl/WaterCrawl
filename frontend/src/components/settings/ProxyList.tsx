import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  return (
    <div className="overflow-hidden rounded-md bg-card shadow">
      <div className="p-4">
        <div className="flex justify-between">
          <div className="flex items-center font-medium text-foreground">
            {proxy.name}
            {proxy.is_default && (
              <span className="ms-2 rounded bg-primary-light px-2 py-0.5 text-xs font-semibold text-primary-dark">
                {t('settings.proxy.default')}
              </span>
            )}
          </div>
          <div className="flex gap-x-2">
            <button
              onClick={() => onEdit(proxy)}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-primary"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(proxy.slug)}
              disabled={isDeleting}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? (
                <svg
                  className="h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <TrashIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          <p className="mb-1">
            <span className="font-medium">{t('settings.proxy.table.connection')}: </span>
            {proxy.proxy_type}://{proxy.host}:{proxy.port}
          </p>
          <p className="mb-1">
            <span className="font-medium">{t('settings.proxy.table.username')}: </span>
            {proxy.username}
          </p>
          <p>
            <span className="font-medium">{t('settings.proxy.table.created')}: </span>
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
  onDelete,
}) => {
  const { t } = useTranslation();
  if (loading && proxies.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-border"></div>
          <p className="text-sm text-muted-foreground">{t('settings.proxy.loading')}</p>
        </div>
      </div>
    );
  }

  if (proxies.length === 0) {
    return (
      <div className="rounded-lg bg-card py-12 text-center shadow">
        <svg
          className="mx-auto h-12 w-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-foreground">
          {t('settings.proxy.noProxies')}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('settings.proxy.noProxiesSubtitle')}
        </p>
      </div>
    );
  }

  return (
    <>
      {isTabletOrMobile ? (
        <div className="space-y-4">
          {proxies.map(proxy => (
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
        <div className="overflow-hidden rounded-lg shadow ring-1 ring-black ring-opacity-5">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pe-3 ps-4 text-start text-sm font-semibold text-foreground sm:ps-6"
                >
                  {t('settings.proxy.table.name')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                >
                  {t('settings.proxy.table.type')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                >
                  {t('settings.proxy.table.host')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                >
                  {t('settings.proxy.table.port')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                >
                  {t('settings.proxy.table.username')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
                >
                  {t('settings.proxy.table.created')}
                </th>
                <th scope="col" className="relative py-3.5 pe-4 ps-3 sm:pe-6">
                  <span className="sr-only">{t('settings.proxy.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {proxies.map(proxy => (
                <tr key={proxy.slug} className="hover:bg-muted">
                  <td className="whitespace-nowrap py-4 pe-3 ps-4 text-sm font-medium text-foreground sm:ps-6">
                    {proxy.name}
                    {proxy.is_default && (
                      <span className="ms-2 inline-flex items-center rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary-dark">
                        {t('settings.proxy.default')}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                    {proxy.proxy_type}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                    {proxy.host}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                    {proxy.port}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                    {proxy.username}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                    {new Date(proxy.created_at).toLocaleDateString()}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pe-4 ps-3 text-end text-sm font-medium sm:pe-6">
                    <div className="flex justify-end gap-x-3">
                      <button
                        onClick={() => onEdit(proxy)}
                        className="text-muted-foreground hover:text-primary focus:outline-none"
                        title={t('settings.proxy.table.editTitle')}
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onDelete(proxy.slug)}
                        disabled={deletingSlug === proxy.slug}
                        className="text-muted-foreground hover:text-error focus:outline-none"
                        title={t('settings.proxy.table.deleteTitle')}
                      >
                        {deletingSlug === proxy.slug ? (
                          <svg
                            className="h-5 w-5 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
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
