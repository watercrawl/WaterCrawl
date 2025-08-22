import React from 'react';
import { CrawlStatus } from '../../types/crawl';

interface StatusBadgeProps {
  status: CrawlStatus | string;
}

const STATUS_COLORS = {
  new: {
    light: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    dark: { bg: 'dark:bg-indigo-900/10', text: 'dark:text-indigo-400', border: 'dark:border-indigo-900/30' },
  },
  running: {
    light: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    dark: { bg: 'dark:bg-sky-900/10', text: 'dark:text-sky-400', border: 'dark:border-sky-900/30' },
  },
  canceled: {
    light: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    dark: { bg: 'dark:bg-slate-900/10', text: 'dark:text-slate-400', border: 'dark:border-slate-900/30' },
  },
  canceling: {
    light: { bg: 'bg-zinc-50', text: 'text-zinc-700', border: 'border-zinc-200' },
    dark: { bg: 'dark:bg-zinc-900/10', text: 'dark:text-zinc-400', border: 'dark:border-zinc-900/30' },
  },
  failed: {
    light: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    dark: { bg: 'dark:bg-rose-900/10', text: 'dark:text-rose-400', border: 'dark:border-rose-900/30' },
  },
  finished: {
    light: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    dark: { bg: 'dark:bg-emerald-900/10', text: 'dark:text-emerald-400', border: 'dark:border-emerald-900/30' },
  },
  ready: {
    light: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    dark: { bg: 'dark:bg-green-900/10', text: 'dark:text-green-400', border: 'dark:border-green-900/30' },
  },
  processing: {
    light: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    dark: { bg: 'dark:bg-blue-900/10', text: 'dark:text-blue-400', border: 'dark:border-blue-900/30' },
  },
} as const;

const getStatusColor = (status: string) => {
  const colors = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.canceling;
  return `${colors.light.bg} ${colors.light.text} ${colors.light.border} ${colors.dark.bg} ${colors.dark.text} ${colors.dark.border}`;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
        status
      )}`}
    >
      {status}
    </span>
  );
};
