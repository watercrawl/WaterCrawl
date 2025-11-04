import React from 'react';
import { useTranslation } from 'react-i18next';

interface UsageLimitBoxProps {
  label?: string;
  current: number;
  limit: number; // -1 means unlimited
  className?: string;
}

export const UsageLimitBox: React.FC<UsageLimitBoxProps> = ({
  label = 'Usage',
  current,
  limit,
  className = '',
}) => {
  const { t } = useTranslation();
  const isUnlimited = limit === -1;
  const percent = !isUnlimited && limit > 0 ? Math.min(100, (current / limit) * 100) : 0;
  const warn = !isUnlimited && limit > 0 && current >= limit * 0.8 && current < limit;
  const danger = !isUnlimited && limit > 0 && current >= limit;

  return (
    <div className={`w-[250px] rounded-lg border border-border bg-muted px-3 py-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={`text-sm font-semibold ${
            danger ? 'text-error' : warn ? 'text-warning' : 'text-foreground'
          }`}
        >
          {isUnlimited ? (
            <>
              {current}/{t('usage.unlimited')}
            </>
          ) : (
            <>
              {current}/{limit}
            </>
          )}
        </div>
      </div>

      {!isUnlimited && (
        <div className="mt-2 h-2 w-full rounded-full border border-border/50 bg-muted/50">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              danger ? 'bg-error' : warn ? 'bg-warning' : 'bg-primary'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {isUnlimited && (
        <div className="mt-2 text-[10px] text-muted-foreground">{t('usage.noLimit')}</div>
      )}
    </div>
  );
};

export default UsageLimitBox;
