import React from 'react';
import { useTranslation } from 'react-i18next';

interface UsageLimitBoxProps {
  label?: string;
  current: number;
  limit: number; // -1 means unlimited
  className?: string;
}

export const UsageLimitBox: React.FC<UsageLimitBoxProps> = ({ label = 'Usage', current, limit, className = '' }) => {
  const { t } = useTranslation();
  const isUnlimited = limit === -1;
  const percent = !isUnlimited && limit > 0 ? Math.min(100, (current / limit) * 100) : 0;
  const warn = !isUnlimited && limit > 0 && current >= limit * 0.8 && current < limit;
  const danger = !isUnlimited && limit > 0 && current >= limit;

  return (
    <div className={`w-[250px] border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-600 dark:text-gray-400">{label}</div>
        <div className={`text-sm font-semibold ${
          danger
            ? 'text-red-600 dark:text-red-400'
            : warn
            ? 'text-yellow-600 dark:text-yellow-400'
            : 'text-gray-800 dark:text-gray-200'
        }`}>
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
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              danger ? 'bg-red-500' : warn ? 'bg-yellow-500' : 'bg-primary-500'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {isUnlimited && (
        <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400">{t('usage.noLimit')}</div>
      )}
    </div>
  );
};

export default UsageLimitBox;
