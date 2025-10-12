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
    <div className="mt-4 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg sm:px-6">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t('pagination.showing')} <span className="font-medium">{startItem}</span> {t('pagination.to')}{' '}
            <span className="font-medium">{endItem}</span> {t('pagination.of')}{' '}
            <span className="font-medium">{totalItems}</span> {t('pagination.results')}
          </p>
        </div>
        <div className="flex gap-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPreviousPage || loading}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.previous')}
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage || loading}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.next')}
          </button>
        </div>
      </div>
    </div>
  );
};
