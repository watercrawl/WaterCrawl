import React from 'react';

import { Cog6ToothIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ListItemProps {
  label: string;
  onConfigure?: () => void;
  onDelete: () => void;
  configureTitle?: string;
  children?: React.ReactNode;
}

const ListItem: React.FC<ListItemProps> = ({
  label,
  onConfigure,
  onDelete,
  configureTitle,
  children,
}) => {
  return (
    <div className="flex items-center justify-between rounded-md border border-input-border bg-card px-3 py-2">
      {children || (
        <span className="text-xs font-medium text-foreground">{label}</span>
      )}
      <div className="flex items-center gap-x-1">
        {onConfigure && (
          <button
            type="button"
            onClick={onConfigure}
            className="text-muted-foreground hover:text-primary"
            title={configureTitle}
          >
            <Cog6ToothIcon className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="text-muted-foreground hover:text-danger"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ListItem;
