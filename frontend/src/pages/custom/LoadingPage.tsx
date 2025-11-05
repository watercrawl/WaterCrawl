import React from 'react';

import { useTranslation } from 'react-i18next';

import { PublicSkeleton } from '../../layouts/PublicSkeleton';

interface LoadingPageProps {
  message?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ message }) => {
  const { t } = useTranslation();
  const displayMessage = message || t('loading.applicationSettings');
  return (
    <PublicSkeleton>
      <div className="mt-12 flex items-center justify-center">
        <div className="text-center">
          {/* Wave animation loader */}
          <div className="mb-6 flex justify-center gap-x-2">
            {[0, 1, 2, 3, 4].map(index => (
              <div
                key={index}
                className="h-12 w-2 animate-pulse rounded-full bg-gradient-to-t from-primary to-primary"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: '1.5s',
                }}
              ></div>
            ))}
          </div>

          {/* Loading text with typing animation */}
          <div className="relative">
            <p className="text-lg font-medium text-foreground">{displayMessage}</p>
            <span className="absolute -end-4 top-0 animate-bounce text-xl text-primary">.</span>
            <span
              className="absolute -end-6 top-0 animate-bounce text-xl text-primary"
              style={{ animationDelay: '0.2s' }}
            >
              .
            </span>
            <span
              className="absolute -end-8 top-0 animate-bounce text-xl text-primary"
              style={{ animationDelay: '0.4s' }}
            >
              .
            </span>
          </div>
        </div>
      </div>
    </PublicSkeleton>
  );
};
