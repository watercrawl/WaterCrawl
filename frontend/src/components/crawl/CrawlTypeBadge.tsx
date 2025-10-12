import React from 'react';
import { useTranslation } from 'react-i18next';
import { CrawlType } from '../../types/crawl';

interface CrawlTypeBadgeProps {
  type: CrawlType;
}

const CRAWL_TYPE_COLORS = {
  single: {
    light: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    dark: { bg: 'dark:bg-indigo-900/10', text: 'dark:text-indigo-400', border: 'dark:border-indigo-900/30' },
  },
  batch: {
    light: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    dark: { bg: 'dark:bg-indigo-900/10', text: 'dark:text-indigo-400', border: 'dark:border-indigo-900/30' },
  },
} as Record<CrawlType, { light: { bg: string; text: string; border: string; }; dark: { bg: string; text: string; border: string; }; }>;

const getCrawlTypeColor = (type: string) => {
  const colors = CRAWL_TYPE_COLORS[type as keyof typeof CRAWL_TYPE_COLORS] || CRAWL_TYPE_COLORS.single;
  return `${colors.light.bg} ${colors.light.text} ${colors.light.border} ${colors.dark.bg} ${colors.dark.text} ${colors.dark.border}`;
};

export const CrawlTypeBadge: React.FC<CrawlTypeBadgeProps> = ({ type }: CrawlTypeBadgeProps) => {
  const { t } = useTranslation();
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCrawlTypeColor(
        type
      )}`}
    >
      {t(`crawl.type.${type}`)}
    </span>
  );
};
