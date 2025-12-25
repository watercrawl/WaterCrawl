import React from 'react';

import { PlusIcon } from '@heroicons/react/24/outline';

interface SectionHeaderProps {
  title: string;
  showAddButton?: boolean;
  onAdd?: () => void;
  addButtonLabel?: string;
  rightContent?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  showAddButton = false,
  onAdd,
  addButtonLabel = 'Add',
  rightContent,
}) => {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {rightContent || (showAddButton && onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-x-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
        >
          <PlusIcon className="h-3 w-3" />
          {addButtonLabel}
        </button>
      ))}
    </div>
  );
};

export default SectionHeader;
