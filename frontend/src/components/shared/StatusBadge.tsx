import React from 'react';
import { CrawlStatus } from '../../types/crawl';
import {
  PlusIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckIcon,
  BeakerIcon,
  ArchiveBoxIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

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
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-info-light text-info-dark border-info-light',
  running: 'bg-info-light text-info-dark border-info-light',
  canceled: 'bg-muted text-muted-foreground border-border',
  canceling: 'bg-muted text-muted-foreground border-border',
  failed: 'bg-error-light text-error-dark border-error-light',
  finished: 'bg-success-light text-success-dark border-success-light',
  ready: 'bg-success-light text-success-dark border-success-light',
  processing: 'bg-info-light text-info-dark border-info-light',
  active: 'bg-success-light text-success-dark border-success-light',
  archived: 'bg-warning-light text-warning-dark border-warning-light',
  deleted: 'bg-error-light text-error-dark border-error-light',
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
