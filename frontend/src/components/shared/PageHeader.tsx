import React from 'react';

import { useTranslation } from 'react-i18next';

interface PageHeaderProps {
  titleKey: string;
  descriptionKey?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ titleKey, descriptionKey, actions }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t(titleKey)}</h1>
        {descriptionKey && (
          <p className="mt-2 text-sm text-muted-foreground">{t(descriptionKey)}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;
