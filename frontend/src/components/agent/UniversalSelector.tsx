import { useState, useEffect, useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import Loading from '../shared/Loading';
import { Pagination } from '../shared/Pagination';

import EmptyState from './EmptyState';

interface SelectionItem {
  uuid: string;
  title: string;
  description?: string;
  status?: string;
}

interface UniversalSelectorProps<T extends SelectionItem> {
  onSelect: (itemUuid: string) => void;
  selectedUuids: string[];
  fetchData: (page: number, search: string) => Promise<{ results: T[]; count: number }>;
  searchPlaceholder?: string;
  emptyMessage?: string;
  renderItem?: (item: T) => React.ReactNode;
}

const UniversalSelector = <T extends SelectionItem>({
  onSelect,
  selectedUuids,
  fetchData,
  searchPlaceholder,
  emptyMessage,
  renderItem,
}: UniversalSelectorProps<T>) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchData(page, searchQuery);
      setItems(data.results);
      setTotalCount(data.count);
    } catch (error) {
      console.error('Error loading selection data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchData, page, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const isItemSelected = (uuid: string) => selectedUuids.includes(uuid);

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      <div className="mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder={searchPlaceholder || t('common.search')}
            className="w-full ps-9 pe-4 py-2 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-full py-12">
            <Loading size="md" />
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2 pe-1">
            {items.map((item) => (
              <div
                key={item.uuid}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isItemSelected(item.uuid)
                    ? 'border-primary bg-primary-soft'
                    : 'border-border bg-card hover:bg-muted/50'
                }`}
              >
                <div className="flex-1 min-w-0 pe-4">
                  <div className="font-medium text-foreground truncate">{item.title}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.description}
                    </div>
                  )}
                  {renderItem && renderItem(item)}
                </div>
                <button
                  type="button"
                  onClick={() => !isItemSelected(item.uuid) && onSelect(item.uuid)}
                  disabled={isItemSelected(item.uuid)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    isItemSelected(item.uuid)
                      ? 'bg-success text-success-foreground cursor-default'
                      : 'bg-primary text-primary-foreground hover:bg-primary-hover'
                  }`}
                >
                  {isItemSelected(item.uuid) ? t('common.added') : t('common.add')}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message={emptyMessage || t('common.noResults')} />
        )}
      </div>

      {totalCount > pageSize && (
        <div className="mt-4 pt-4 border-t border-border">
          <Pagination
            currentPage={page}
            totalItems={totalCount}
            itemsPerPage={pageSize}
            hasNextPage={page * pageSize < totalCount}
            hasPreviousPage={page > 1}
            onPageChange={setPage}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default UniversalSelector;
