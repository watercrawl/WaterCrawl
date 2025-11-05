import React from 'react';

import { useTranslation } from 'react-i18next';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  loading = false,
}) => {
  const { t } = useTranslation();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 sm:px-6">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center">
          <p className="text-sm text-foreground">
            {t('pagination.showing')} <span className="font-medium">{startItem}</span>{' '}
            {t('pagination.to')} <span className="font-medium">{endItem}</span> {t('pagination.of')}{' '}
            <span className="font-medium">{totalItems}</span> {t('pagination.results')}
          </p>
        </div>
        <div className="flex gap-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPreviousPage || loading}
            className="relative inline-flex items-center rounded-md border border-input-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('common.previous')}
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage || loading}
            className="relative inline-flex items-center rounded-md border border-input-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('common.next')}
          </button>
        </div>
      </div>
    </div>
  );
};
