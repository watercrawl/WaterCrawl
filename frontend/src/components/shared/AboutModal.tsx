import React from 'react';

import { useTranslation } from 'react-i18next';

import { InformationCircleIcon } from '@heroicons/react/24/outline';

import { useSettings } from '../../contexts/SettingsProvider';
import { useTheme } from '../../contexts/ThemeContext';

import { Modal } from './Modal';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { isDark } = useTheme();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('common.aboutWaterCrawl')}
      icon={InformationCircleIcon}
      iconClassName="h-5 w-5 text-info"
      iconBgClassName="bg-info-soft"
      size="sm"
    >
      <div className="space-y-4">
        {/* Logo, Name and Version */}
        <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2.5">
          <img
            src={isDark ? '/logo-dark.svg' : '/logo.svg'}
            alt="WaterCrawl"
            className="h-10 w-10"
          />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-foreground">WaterCrawl</h4>
            <p className="text-xs text-muted-foreground">
              {t('common.version')} {settings?.api_version || 'N/A'}
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="space-y-1.5">
          <a
            href="https://github.com/watercrawl/watercrawl"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <span>{t('common.githubRepository')}</span>
            <svg className="h-4 w-4 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </a>

          <a
            href="https://watercrawl.dev/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <span>{t('common.termsOfService')}</span>
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>

          <a
            href="https://watercrawl.dev/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <span>{t('common.privacyPolicy')}</span>
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>

        {/* License */}
        <div className="rounded-lg bg-muted px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">{t('common.license')}</span>
            <span className="text-xs text-muted-foreground">MIT License</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-3 text-center text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} WaterCrawl
        </div>
      </div>
    </Modal>
  );
};
