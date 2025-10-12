import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { LanguageSelector } from '../components/shared/LanguageSelector';

export const PublicSkeleton: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 end-16">
        <LanguageSelector />
      </div>
      <button
        onClick={toggleTheme}
        className="absolute top-4 end-4 p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <SunIcon className="h-5 w-5" />
        ) : (
          <MoonIcon className="h-5 w-5" />
        )}
      </button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold">
          <span>
            {theme === 'dark' ? (
              <img
                src="/logo-dark.svg"
                alt="WaterCrawl"
                className="inline-block mx-2"
                width={42}
                height={42}
              />
            ) : (
              <img
                src="/logo.svg"
                alt="WaterCrawl"
                className="inline-block mx-2"
                width={42}
                height={42}
              />
            )}
          </span>
          <span className={`text-2xl font-semibold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent dark:from-blue-200 dark:to-blue-100`}>
            WaterCrawl
          </span>
        </h2>
      </div>
      {children}
    </div>
  );
};
