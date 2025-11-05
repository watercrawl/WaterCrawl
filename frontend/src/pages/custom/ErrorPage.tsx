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
      <div className="mt-12 flex items-center justify-center">
        <div className="mx-auto max-w-2xl rounded-lg border border-error bg-error-soft p-6 shadow-md">
          <div className="mb-4 flex items-center">
            <svg
              className="me-3 h-8 w-8 text-error"
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
            <h2 className="text-xl font-semibold text-error">{t('error.settingsError')}</h2>
          </div>
          <p className="mb-4 text-foreground">{t('error.description')}</p>
          <ul className="mb-4 list-disc space-y-2 ps-5 text-foreground">
            <li>{t('error.reasons.backendDown')}</li>
            <li>{t('error.reasons.apiMisconfigured')}</li>
            <li>{t('error.reasons.corsIssues')}</li>
            <li>{t('error.reasons.networkProblems')}</li>
            <li>{t('error.reasons.serviceErrors')}</li>
          </ul>

          {error && (
            <div className="mb-4 overflow-auto rounded bg-error-soft p-3 font-mono text-sm text-error">
              <p className="font-semibold">{t('error.errorDetails')}:</p>
              {error.message}
            </div>
          )}

          <div className="mb-4 overflow-auto rounded bg-muted p-3">
            <p className="mb-2 font-semibold text-foreground">{t('error.currentConfiguration')}:</p>
            <div className="flex items-center gap-x-2">
              <span className="text-muted-foreground">{t('error.apiUrl')}:</span>
              <code className="rounded bg-muted px-2 py-1 text-sm text-foreground">{API_URL}</code>
            </div>
          </div>

          <div className="mb-2 flex flex-col space-y-3 sm:flex-row sm:justify-between sm:gap-x-4 sm:space-y-0">
            {onRetry && (
              <button
                onClick={onRetry}
                className="rounded-md bg-error px-4 py-2 text-white transition-colors duration-200 hover:bg-error-strong focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2"
              >
                {t('error.tryAgain')}
              </button>
            )}
            <a
              href="https://docs.watercrawl.dev/self-hosted/troubleshooting"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-input-border bg-card px-4 py-2 text-center text-foreground transition-colors duration-200 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {t('error.troubleshootingGuide')}
            </a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {t('error.checkDocs')}{' '}
            <a
              href="https://docs.watercrawl.dev/self-hosted/troubleshooting"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('error.troubleshootingDocs')}
            </a>{' '}
            {t('error.forMoreHelp')}.
          </p>
        </div>
      </div>
    </PublicSkeleton>
  );
};
