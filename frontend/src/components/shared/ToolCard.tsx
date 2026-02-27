import { useState } from 'react';

import { useTranslation } from 'react-i18next';

import {
  CommandLineIcon,
  CubeIcon,
  CheckCircleIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';

import ToolDrawer from './ToolDrawer';

interface ToolCardProps {
  name: string;
  description?: string;
  toolKey?: string;
  method?: string;
  path?: string;
  variant?: 'selectable' | 'viewable';
  isSelected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  showKey?: boolean;
  /** Tool UUID for drawer functionality */
  toolUuid?: string;
}

const ToolCard: React.FC<ToolCardProps> = ({
  name,
  description,
  toolKey,
  method: _method,
  path: _path,
  variant = 'viewable',
  isSelected = false,
  onSelect,
  onClick,
  disabled = false,
  size = 'md',
  showKey = true,
  toolUuid,
}) => {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Truncate description
  const truncatedDescription =
    description && description.length > 100
      ? description.substring(0, 100) + '...'
      : description;

  const handleClick = () => {
    if (disabled) return;
    if (variant === 'selectable' && onSelect) {
      onSelect();
    } else if (onClick) {
      onClick();
    } else if (toolUuid) {
      setIsDrawerOpen(true);
    }
  };

  const iconSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const iconInnerSize = size === 'sm' ? 'h-4 w-4' : 'h-4.5 w-4.5';
  const padding = size === 'sm' ? 'px-3 py-2.5' : 'px-3.5 py-3';

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled && variant === 'selectable'}
        className={`group w-full rounded-lg border ${padding} text-start transition-all duration-200 ${
          variant === 'selectable' && isSelected
            ? 'border-success bg-success-soft/20 cursor-not-allowed'
            : variant === 'selectable'
            ? 'border-border bg-card hover:border-primary hover:bg-primary/5 cursor-pointer'
            : 'border-border bg-card hover:shadow-md hover:border-primary/50 cursor-pointer'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <div
              className={`${iconSize} rounded-lg flex items-center justify-center transition-colors ${
                variant === 'selectable' && isSelected
                  ? 'bg-success text-success-foreground'
                  : 'bg-primary/10 text-primary group-hover:bg-primary/15'
              }`}
            >
              {variant === 'selectable' && isSelected ? (
                <CheckCircleIcon className={iconInnerSize} />
              ) : variant === 'selectable' ? (
                <CubeIcon className={iconInnerSize} />
              ) : (
                <CommandLineIcon className={iconInnerSize} />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
              <span
                className={`text-sm font-semibold truncate ${
                  variant === 'selectable' && isSelected
                    ? 'text-success'
                      : 'text-foreground'
                } transition-colors`}
              >
                {name}
              </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {showKey && toolKey && (
                  <code className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted/60 border border-border/30">
                    {toolKey}
                  </code>
                )}
                {/* Selection indicator */}
                {variant === 'selectable' && !isSelected && (
                  <PlusCircleIcon className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>

            {/* Description */}
            {truncatedDescription && (
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {truncatedDescription}
              </p>
            )}

            {/* Selected Badge */}
            {variant === 'selectable' && isSelected && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-success">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                <span>{t('common.added')}</span>
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Drawer */}
      {toolUuid && (
        <ToolDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          toolUuid={toolUuid}
          initialTab="details"
        />
      )}
    </>
  );
};

export default ToolCard;
