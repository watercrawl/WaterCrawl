import React from 'react';

import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

import { LanguageSelector } from '../components/shared/LanguageSelector';
import { useTheme } from '../contexts/ThemeContext';

export const PublicSkeleton: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col justify-center bg-muted py-12 sm:px-6 lg:px-8">
      <div className="absolute end-16 top-4">
        <LanguageSelector />
      </div>
      <button
        onClick={toggleTheme}
        className="absolute end-4 top-4 rounded-lg bg-muted p-2 text-foreground transition-colors hover:bg-muted"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      </button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold">
          <span>
            {theme === 'dark' ? (
              <img
                src="/logo-dark.svg"
                alt="WaterCrawl"
                className="mx-2 inline-block"
                width={42}
                height={42}
              />
            ) : (
              <img
                src="/logo.svg"
                alt="WaterCrawl"
                className="mx-2 inline-block"
                width={42}
                height={42}
              />
            )}
          </span>
          <span
            className={`bg-gradient-to-r from-primary-hover to-primary bg-clip-text text-2xl font-semibold text-transparent`}
          >
            WaterCrawl
          </span>
        </h2>
      </div>
      {children}
    </div>
  );
};
