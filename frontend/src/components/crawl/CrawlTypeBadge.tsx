import React from 'react';

import { useTranslation } from 'react-i18next';

import { CrawlType } from '../../types/crawl';

interface CrawlTypeBadgeProps {
  type: CrawlType;
}

const CRAWL_TYPE_COLORS: Record<CrawlType, string> = {
  single: 'bg-info-soft text-info-strong border-info',
  batch: 'bg-info-soft text-info-strong border-info',
};

const getCrawlTypeColor = (type: CrawlType): string => {
  return CRAWL_TYPE_COLORS[type] || CRAWL_TYPE_COLORS.single;
};

export const CrawlTypeBadge: React.FC<CrawlTypeBadgeProps> = ({ type }: CrawlTypeBadgeProps) => {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getCrawlTypeColor(type)}`}
    >
      {t(`crawl.type.${type}`)}
    </span>
  );
};
