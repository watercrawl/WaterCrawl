import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ size = 'md', className = '' }) => {
  const { t } = useTranslation();
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-primary border-t-transparent`}
        role="status"
        aria-label="loading"
      >
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    </div>
  );
};

export default Loading;
