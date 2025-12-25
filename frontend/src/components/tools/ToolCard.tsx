import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import {
  WrenchIcon,
  ServerIcon,
  SparklesIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

import ToolDrawer from '../shared/ToolDrawer';

import type { ToolListItem } from '../../types/tools';

interface ToolCardProps {
  tool: ToolListItem;
  onDelete?: () => void;
  isPolling?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onDelete, isPolling = false }) => {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'details' | 'test'>('details');
  const [showActions, setShowActions] = useState(false);

  const getToolTypeInfo = () => {
    switch (tool.tool_type) {
      case 'mcp':
        return {
          icon: ServerIcon,
          label: 'MCP',
          color: 'text-info',
          bg: 'bg-info-soft',
        };
      case 'api_spec':
        return {
          icon: WrenchIcon,
          label: 'API',
          color: 'text-warning',
          bg: 'bg-warning-soft',
        };
      case 'built_in':
      default:
        return {
          icon: SparklesIcon,
          label: t('tools.builtin'),
          color: 'text-primary',
          bg: 'bg-primary-soft',
        };
    }
  };

  const typeInfo = getToolTypeInfo();
  const TypeIcon = typeInfo.icon;

  const handleCardClick = () => {
    setDrawerTab('details');
    setIsDrawerOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    onDelete?.();
  };

  // Truncate description for display
  const truncatedDescription = tool.description
    ? tool.description.length > 100
      ? tool.description.substring(0, 100) + '...'
      : tool.description
    : null;

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group relative flex flex-col rounded-lg border border-border bg-card p-3.5 transition-all duration-200 hover:shadow-md hover:border-primary/50 cursor-pointer"
      >
        {/* Polling indicator */}
        {isPolling && (
          <div className="absolute -top-1 -right-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
            </span>
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
          <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${typeInfo.bg}`}
          >
              <TypeIcon className={`h-4.5 w-4.5 ${typeInfo.color}`} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground truncate">
                {tool.name}
                </span>
            </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <code className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted/60 border border-border/30">
                  {tool.key}
                </code>
          {/* Actions dropdown */}
                {onDelete && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
                      className="rounded-lg p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all"
            >
              <EllipsisVerticalIcon className="h-4 w-4" />
            </button>
            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(false);
                  }}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-border bg-card shadow-lg py-1">
                    <button
                      onClick={handleDeleteClick}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-soft transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                      {t('common.delete')}
                    </button>
                </div>
              </>
                    )}
                  </div>
            )}
          </div>
        </div>

        {/* Description */}
        {truncatedDescription && (
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {truncatedDescription}
            </p>
            )}
          </div>
        </div>

        {/* Polling status */}
        {isPolling && (
          <div className="absolute bottom-0 left-0 right-0 bg-warning-soft rounded-b-lg px-3 py-1.5 flex items-center gap-2">
            <ArrowPathIcon className="h-3 w-3 text-warning animate-spin" />
            <span className="text-xs text-warning font-medium">
              {t('tools.mcp.validating')}...
            </span>
          </div>
        )}
      </div>

      <ToolDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        tool={tool}
        initialTab={drawerTab}
      />
    </>
  );
};

export default ToolCard;
