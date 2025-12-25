import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  PlusIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckIcon,
  BeakerIcon,
  ArchiveBoxIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

import { CrawlStatus } from '../../types/crawl';

interface StatusBadgeProps {
  status: CrawlStatus | string;
  showIcon?: boolean;
}

const STATUS_ICONS = {
  new: <PlusIcon className="h-4 w-4" />,
  running: <ArrowPathIcon className="h-4 w-4" />,
  canceled: <XMarkIcon className="h-4 w-4" />,
  canceling: <ArrowPathIcon className="h-4 w-4" />,
  failed: <ExclamationTriangleIcon className="h-4 w-4" />,
  finished: <CheckIcon className="h-4 w-4" />,
  ready: <CheckIcon className="h-4 w-4" />,
  processing: <BeakerIcon className="h-4 w-4" />,
  active: <CheckIcon className="h-4 w-4" />,
  archived: <ArchiveBoxIcon className="h-4 w-4" />,
  deleted: <TrashIcon className="h-4 w-4" />,
  draft: <PencilIcon className="h-4 w-4" />,
  published: <CheckCircleIcon className="h-4 w-4" />,
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-info text-info-foreground border-info',
  running: 'bg-info text-info-foreground border-info',
  canceled: 'bg-muted text-muted-foreground border-border',
  canceling: 'bg-muted text-muted-foreground border-border',
  failed: 'bg-error text-error-foreground border-error',
  finished: 'bg-success text-success-foreground border-success',
  ready: 'bg-success text-success-foreground border-success',
  processing: 'bg-info text-info-foreground border-info',
  active: 'bg-success text-success-foreground border-success',
  archived: 'bg-warning text-warning-foreground border-warning',
  deleted: 'bg-error text-error-foreground border-error',
  draft: 'bg-warning text-warning-foreground border-warning',
  published: 'bg-success text-success-foreground border-success',
} as const;

const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status.toLowerCase()] || STATUS_COLORS.canceling;
};
const getStatusIcon = (status: string) => {
  const icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || STATUS_ICONS.canceling;
  return icon;
};
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = false }) => {
  const { t } = useTranslation();
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      new: t('status.new'),
      running: t('status.running'),
      canceled: t('status.canceled'),
      canceling: t('status.canceling'),
      failed: t('status.failed'),
      finished: t('status.finished'),
      ready: t('status.ready'),
      processing: t('status.processing'),
      active: t('status.active'),
      archived: t('status.archived'),
      deleted: t('status.deleted'),
      draft: t('agents.status.draft'),
      published: t('agents.status.published'),
    };
    return statusMap[status.toLowerCase()] || status;
  };
  return (
    <>
      {' '}
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(status)}`}
      >
        {' '}
        {getStatusLabel(status)}{' '}
        {showIcon && <span className="ms-0.5">{getStatusIcon(status)}</span>}
      </span>
    </>
  );
};
