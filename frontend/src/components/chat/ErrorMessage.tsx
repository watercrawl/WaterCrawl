import React from 'react';

import { useTranslation } from 'react-i18next';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import { useDirection } from '../../contexts/DirectionContext';

interface ErrorMessageProps {
  error: string;
  code?: string | number;
}

/**
 * ErrorMessage component - Displays error messages in the chat
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, code }) => {
  const { t, i18n } = useTranslation();
  const { direction } = useDirection();
  const isRTL = direction === 'rtl' || ['ar', 'fa', 'he'].includes(i18n.language);
  
  return (
    <div className="py-1.5 px-3">
      <div className={`rounded-lg border border-error bg-error-soft overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={`px-2.5 py-1.5 flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          <ExclamationTriangleIcon className="h-3.5 w-3.5 text-error flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            {code && (
              <div className="text-xs font-medium text-error mb-1">
                {t('chat.error')} {code}
              </div>
            )}
            <div className="text-xs text-error whitespace-pre-wrap break-words">
              {error}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
