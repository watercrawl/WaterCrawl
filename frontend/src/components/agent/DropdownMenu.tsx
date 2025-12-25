import React from 'react';

interface DropdownMenuItem {
  key: string;
  label: string;
  description?: string;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  onSelect: (key: string) => void;
  width?: string;
  maxHeight?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  items,
  onSelect,
  width = 'w-48',
  maxHeight,
}) => {
  return (
    <div className={`absolute right-0 top-full mt-1 z-10 ${width} rounded-md border border-border bg-card shadow-lg ${maxHeight || ''}`}>
      <div className="p-1">
        {items.map(item => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className="w-full text-left rounded-md px-3 py-2 text-xs text-foreground hover:bg-muted"
          >
            <div className="font-medium">{item.label}</div>
            {item.description && (
              <div className="text-muted-foreground text-xs mt-0.5 line-clamp-2">
                {item.description}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DropdownMenu;
