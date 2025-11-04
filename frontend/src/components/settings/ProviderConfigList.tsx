import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProviderConfig } from '../../types/provider';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { AdminProviderConfig } from '../../types/admin/provider';

interface ProviderConfigListProps {
  providerConfigs: ProviderConfig[] | AdminProviderConfig[];
  currentPage: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
  loading: boolean;
  deletingUuid: string | null;
  isTabletOrMobile: boolean;
  onPageChange: (page: number) => void;
  onEdit: (providerConfig: ProviderConfig | AdminProviderConfig) => void;
  onDelete: (uuid: string) => void;
  onView?: (providerConfig: ProviderConfig | AdminProviderConfig) => void;
}

const ProviderConfigList: React.FC<ProviderConfigListProps> = ({
  providerConfigs,
  currentPage,
  totalItems,
  hasNext,
  hasPrevious,
  loading,
  deletingUuid,

  onPageChange,
  onEdit,
  onDelete,
  onView,
}) => {
  const { t } = useTranslation();
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="overflow-hidden bg-card shadow sm:rounded-md">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                {t('settings.providerConfig.table.title')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                {t('settings.providerConfig.table.provider')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                {t('settings.providerConfig.table.global')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                {t('settings.providerConfig.table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="whitespace-nowrap px-6 py-4 text-center text-sm text-muted-foreground"
                >
                  {t('settings.providerConfig.loading')}
                </td>
              </tr>
            ) : providerConfigs.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="whitespace-nowrap px-6 py-4 text-center text-sm text-muted-foreground"
                >
                  {t('settings.providerConfig.noConfigs')}
                </td>
              </tr>
            ) : (
              providerConfigs.map(config => (
                <tr key={config.uuid}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                    {config.title || t('settings.providerConfig.untitled')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                    {config.provider_name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                    <div className="flex gap-x-3">
                      {onView && (
                        <button
                          onClick={() => onView(config)}
                          className="text-primary hover:text-primary-dark"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(config)}
                        className="text-primary hover:text-primary-dark"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onDelete(config.uuid)}
                        className="text-error hover:text-error"
                        disabled={deletingUuid === config.uuid}
                      >
                        {deletingUuid === config.uuid ? (
                          <span className="text-xs">{t('settings.providerConfig.deleting')}</span>
                        ) : (
                          <TrashIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!hasPrevious || loading}
              className="relative inline-flex items-center rounded-md border border-input-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              {t('settings.providerConfig.table.previous')}
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNext || loading}
              className="relative ms-3 inline-flex items-center rounded-md border border-input-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              {t('settings.providerConfig.table.next')}
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-foreground">
                {t('settings.providerConfig.table.showing')}{' '}
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>{' '}
                {t('settings.providerConfig.table.to')}{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{' '}
                {t('settings.providerConfig.table.of')}{' '}
                <span className="font-medium">{totalItems}</span>{' '}
                {t('settings.providerConfig.table.results')}
              </p>
            </div>
            <div>
              <nav
                className="-gap-x-px relative z-0 inline-flex rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={!hasPrevious || loading}
                  className="relative inline-flex items-center rounded-s-md border border-input-border bg-card px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  <span className="sr-only">{t('settings.providerConfig.table.previous')}</span>
                  &larr;
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => onPageChange(pageNumber)}
                      disabled={loading}
                      className={`relative inline-flex items-center border px-4 py-2 ${
                        currentPage === pageNumber
                          ? 'z-10 border-primary bg-primary/10 text-primary'
                          : 'border-input-border bg-card text-muted-foreground hover:bg-muted'
                      } text-sm font-medium`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={!hasNext || loading}
                  className="relative inline-flex items-center rounded-e-md border border-input-border bg-card px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  <span className="sr-only">{t('settings.providerConfig.table.next')}</span>
                  &rarr;
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderConfigList;
