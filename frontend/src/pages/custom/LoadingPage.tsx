import React from 'react';
import { useTranslation } from 'react-i18next';
import { PublicSkeleton } from '../../layouts/PublicSkeleton';

interface LoadingPageProps {
  message?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ 
  message
}) => {
  const { t } = useTranslation();
  const displayMessage = message || t('loading.applicationSettings');
  return (
    <PublicSkeleton>
      <div className="flex items-center justify-center mt-12">
        <div className="text-center">
          {/* Wave animation loader */}
          <div className="flex justify-center gap-x-2 mb-6">
            {[0, 1, 2, 3, 4].map((index) => (
              <div 
                key={index}
                className="w-2 h-12 bg-gradient-to-t from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-full animate-pulse"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: '1.5s'
                }}
              ></div>
            ))}
          </div>
          
          {/* Loading text with typing animation */}
          <div className="relative">
            <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">{displayMessage}</p>
            <span className="absolute -end-4 top-0 animate-bounce text-blue-600 dark:text-blue-400 text-xl">.</span>
            <span className="absolute -end-6 top-0 animate-bounce text-blue-600 dark:text-blue-400 text-xl" style={{ animationDelay: '0.2s' }}>.</span>
            <span className="absolute -end-8 top-0 animate-bounce text-blue-600 dark:text-blue-400 text-xl" style={{ animationDelay: '0.4s' }}>.</span>
          </div>
        </div>
      </div>
    </PublicSkeleton>
  );
};
