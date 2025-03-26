import { XMarkIcon } from '@heroicons/react/24/outline';
import { ReactNode } from 'react';

export type NotificationVariant = 'info' | 'success' | 'warning' | 'error';

const variantStyles: Record<NotificationVariant, { bg: string; hover: string }> = {
  info: { bg: 'bg-blue-600', hover: 'hover:bg-blue-700' },
  success: { bg: 'bg-green-600', hover: 'hover:bg-green-700' },
  warning: { bg: 'bg-yellow-600', hover: 'hover:bg-yellow-700' },
  error: { bg: 'bg-red-600', hover: 'hover:bg-red-700' },
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
  if (!show) return null;

  const { bg, hover } = variantStyles[variant];

  return (
    <div className={`lg:pl-72 ${className}`}>
      <div className={`${bg} px-4 py-3 text-white sm:px-6 lg:px-8`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center">
            {icon && <span className="flex p-2">{icon}</span>}
            <div className={`text-sm font-medium ${icon ? 'ml-3' : ''}`}>
              {children}
            </div>
          </div>
          {closeable && (
            <div className="ml-4 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 text-white focus:outline-none focus:ring-2 focus:ring-white ${hover}`}
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
