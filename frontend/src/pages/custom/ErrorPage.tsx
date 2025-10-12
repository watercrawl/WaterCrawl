import React from 'react';
import { useTranslation } from 'react-i18next';
import { PublicSkeleton } from '../../layouts/PublicSkeleton';
import { API_URL } from '../../utils/env';

interface ErrorPageProps {
  error: Error | null;
  onRetry?: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ error, onRetry }) => {
  const { t } = useTranslation();
  return (
    <PublicSkeleton>
      <div className="flex items-center justify-center mt-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-2xl mx-auto shadow-md">
          <div className="flex items-center mb-4">
            <svg
              className="w-8 h-8 text-red-500 me-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">
              {t('error.settingsError')}
            </h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {t('error.description')}
          </p>
          <ul className="list-disc ps-5 mb-4 text-gray-700 dark:text-gray-300 space-y-2">
            <li>{t('error.reasons.backendDown')}</li>
            <li>{t('error.reasons.apiMisconfigured')}</li>
            <li>{t('error.reasons.corsIssues')}</li>
            <li>{t('error.reasons.networkProblems')}</li>
            <li>{t('error.reasons.serviceErrors')}</li>
          </ul>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/40 p-3 rounded mb-4 overflow-auto text-red-800 dark:text-red-300 text-sm font-mono">
              <p className="font-semibold">{t('error.errorDetails')}:</p>
              {error.message}
            </div>
          )}

          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded mb-4 overflow-auto">
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('error.currentConfiguration')}:
            </p>
            <div className="flex items-center gap-x-2">
              <span className="text-gray-600 dark:text-gray-400">{t('error.apiUrl')}:</span>
              <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm text-gray-800 dark:text-gray-300">
                {API_URL}
              </code>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:gap-x-4 space-y-3 sm:space-y-0 mb-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {t('error.tryAgain')}
              </button>
            )}
            <a
              href="https://docs.watercrawl.dev/self-hosted/troubleshooting"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md transition-colors duration-200 text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              {t('error.troubleshootingGuide')}
            </a>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            {t('error.checkDocs')}{" "}
            <a
              href="https://docs.watercrawl.dev/self-hosted/troubleshooting"
              className="text-blue-600 dark:text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('error.troubleshootingDocs')}
            </a>{" "}
            {t('error.forMoreHelp')}.
          </p>
        </div>
      </div>
    </PublicSkeleton>
  );
};
