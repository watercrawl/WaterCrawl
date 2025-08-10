import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SearchForm } from '../../components/search/SearchForm';
import { SearchOptions } from '../../types/search';
import { useSettings } from '../../contexts/SettingsProvider';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

interface LocationState {
  initialQuery?: string;
  initialNumResults?: number;
  initialSearchOptions?: SearchOptions;
}

const SearchPage: React.FC = () => {
  const location = useLocation();
  const { initialQuery, initialNumResults, initialSearchOptions } = (location.state as LocationState) || {};

  const { settings } = useSettings();
  const { setItems } = useBreadcrumbs();
  useEffect(() => {
    setItems([
      { label: 'Dashboard', href: '/dashboard'},
      { label: 'Search Playground', href: '/dashboard/search', current: true },
    ]);
  }, [setItems]);

  return (
    <div className="px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Search Playground</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Test and experiment with different internet search configurations in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {!settings || !settings?.is_search_configured ? (
          <div className="p-5 border border-blue-200 rounded-lg bg-blue-50 dark:bg-gray-800 dark:border-gray-700 shadow-sm">
            <div className="flex items-start">
              <InformationCircleIcon className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" aria-hidden="true" />
              <div>
                <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300">Activate Google Custom Search</h3>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                  To enable the search playground, you need to configure Google Custom Search Engine (CSE) credentials.
                  WaterCrawl uses these to perform searches via the Google API.
                </p>
                <div className="mt-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-300">Step 1: Get Your Credentials</h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Obtain your API Key and CSE ID from Google Cloud Console and the Programmable Search Engine control panel.
                    </p>
                    <div className="mt-1 text-sm space-x-4">
                      <a href="https://developers.google.com/custom-search/v1/overview" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">Google API Docs</a>
                      <a href="https://programmablesearchengine.google.com/controlpanel/all" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">CSE Control Panel</a>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-300">Step 2: Update Configuration</h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Add the following lines to the <code>.env</code> file located in the <strong>backend</strong> root directory of your project:
                    </p>
                    <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs text-gray-800 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">
                      <code>
{`SCRAPY_GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE
SCRAPY_GOOGLE_CSE_ID=YOUR_CSE_ID_HERE`}
                      </code>
                    </pre>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Replace the placeholder values with your actual credentials.</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-300">Step 3: Restart Backend</h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      After saving the <code>.env</code> file, restart your backend server for the changes to be applied.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <SearchForm
            initialQuery={initialQuery}
            initialNumResults={initialNumResults}
            initialSearchOptions={initialSearchOptions}
          />
        )}
      </div>
    </div>
  );
};

export default SearchPage;
