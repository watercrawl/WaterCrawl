import { ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

export type NotificationVariant = 'info' | 'success' | 'warning' | 'error';

const variantStyles: Record<NotificationVariant, { bg: string; hover: string }> = {
  info: { bg: 'bg-primary-hover', hover: 'hover:bg-primary-hover' },
  success: { bg: 'bg-success', hover: 'hover:bg-success-strong' },
  warning: { bg: 'bg-warning', hover: 'hover:bg-warning-strong' },
  error: { bg: 'bg-error', hover: 'hover:bg-error-strong' },
};

interface NotificationBannerProps {
  show: boolean;
  onClose: () => void;
  closeable?: boolean;
  variant?: NotificationVariant;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const NotificationBanner = ({
  show,
  onClose,
  closeable = true,
  variant = 'info',
  icon,
  children,
  className = '',
}: NotificationBannerProps) => {
  const { t } = useTranslation();
  if (!show) return null;

  const { bg, hover } = variantStyles[variant];

  return (
    <div className={`lg:ps-72 ${className}`}>
      <div className={`${bg} px-4 py-3 text-white sm:px-6 lg:px-8`}>
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center">
            {icon && <span className="flex p-2">{icon}</span>}
            <div className={`text-sm font-medium ${icon ? 'ms-3' : ''}`}>{children}</div>
          </div>
          {closeable && (
            <div>
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 text-white focus:outline-none focus:ring-2 focus:ring-white ${hover}`}
              >
                <span className="sr-only">{t('common.dismiss')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
