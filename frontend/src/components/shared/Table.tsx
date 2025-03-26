import React from 'react';
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
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
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
        <div className="inline-block min-w-full py-2 align-middle px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={twMerge(
                        'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                        column.className
                      )}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((item, index) => {
                  const baseRowClass = 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200';
                  const customRowClass = typeof rowClassName === 'function' ? rowClassName(item) : rowClassName;
                  const finalRowClass = twMerge(baseRowClass, customRowClass);

                  return (
                    <tr
                      key={index}
                      className={finalRowClass}
                      onClick={() => onRowClick?.(item)}
                      role={onRowClick ? 'button' : undefined}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={twMerge(
                            'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100',
                            column.className
                          )}
                        >
                          {column.render
                            ? column.render(item)
                            // @ts-ignore - We know this is safe because the key exists in the item
                            : item[column.key]}
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
