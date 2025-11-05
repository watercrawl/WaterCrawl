import React from 'react';

import { useTranslation } from 'react-i18next';

import { twMerge } from 'tailwind-merge';

export interface Column<T> {
  header: string;
  key: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  rowClassName?: string | ((item: T) => string);
  onRowClick?: (item: T) => void;
}

export function Table<T>({
  columns,
  data,
  loading = false,
  emptyState,
  rowClassName,
  onRowClick,
}: TableProps<T>) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-border"></div>
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!data.length && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="mt-8 flex flex-col">
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full px-4 py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-lg shadow ring-1 ring-black ring-opacity-5">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  {columns.map(column => (
                    <th
                      key={column.key}
                      scope="col"
                      className={twMerge(
                        'px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-muted-foreground',
                        column.className
                      )}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {data.map((item, index) => {
                  const baseRowClass = 'hover:bg-muted transition-colors duration-200';
                  const customRowClass =
                    typeof rowClassName === 'function' ? rowClassName(item) : rowClassName;
                  const finalRowClass = twMerge(baseRowClass, customRowClass);

                  return (
                    <tr
                      key={index}
                      className={finalRowClass}
                      onClick={() => onRowClick?.(item)}
                      role={onRowClick ? 'button' : undefined}
                    >
                      {columns.map(column => (
                        <td
                          key={column.key}
                          className={twMerge(
                            'whitespace-nowrap px-6 py-4 text-sm text-foreground',
                            column.className
                          )}
                        >
                          {column.render
                            ? column.render(item)
                            : // @ts-ignore - We know this is safe because the key exists in the item
                              item[column.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
