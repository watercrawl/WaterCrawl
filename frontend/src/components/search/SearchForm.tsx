import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import ComboboxComponent from '../shared/ComboboxComponent';
import { FormInput } from '../shared/FormComponents';
import { SearchApiDocumentation } from './SearchApiDocumentation';
import { SearchRequest, SearchStatus, SearchType, SearchOptions, Depth, TimeRange } from '../../types/search';
import { searchApi } from '../../services/api/search';
import { SearchResultDisplay } from './SearchResultDisplay';
import { AxiosError } from 'axios';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface SearchFormProps {
  initialRequest?: SearchRequest | null;
  initialQuery?: string;
  initialSearchOptions?: SearchOptions;
  initialNumResults?: number;
  beta?: boolean;
}

// List of available languages for search
const LANGUAGES = [
  { code: 'ar', name: 'Arabic' },
  { code: 'bn', name: 'Bengali' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fa', name: 'Persian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'id', name: 'Indonesian' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ms', name: 'Malay' },
  { code: 'nl', name: 'Dutch' },
  { code: 'no', name: 'Norwegian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sv', name: 'Swedish' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'zh', name: 'Chinese' },
];

// List of countries for search filtering
const COUNTRIES = [
  { code: 'ae', name: 'United Arab Emirates' },
  { code: 'af', name: 'Afghanistan' },
  { code: 'at', name: 'Austria' },
  { code: 'au', name: 'Australia' },
  { code: 'be', name: 'Belgium' },
  { code: 'bg', name: 'Bulgaria' },
  { code: 'br', name: 'Brazil' },
  { code: 'ca', name: 'Canada' },
  { code: 'ch', name: 'Switzerland' },
  { code: 'cn', name: 'China' },
  { code: 'cz', name: 'Czech Republic' },
  { code: 'de', name: 'Germany' },
  { code: 'dk', name: 'Denmark' },
  { code: 'eg', name: 'Egypt' },
  { code: 'es', name: 'Spain' },
  { code: 'fi', name: 'Finland' },
  { code: 'fr', name: 'France' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'gr', name: 'Greece' },
  { code: 'hk', name: 'Hong Kong' },
  { code: 'hu', name: 'Hungary' },
  { code: 'id', name: 'Indonesia' },
  { code: 'ie', name: 'Ireland' },
  { code: 'il', name: 'Israel' },
  { code: 'in', name: 'India' },
  { code: 'iq', name: 'Iraq' },
  { code: 'ir', name: 'Iran' },
  { code: 'it', name: 'Italy' },
  { code: 'jo', name: 'Jordan' },
  { code: 'jp', name: 'Japan' },
  { code: 'kr', name: 'South Korea' },
  { code: 'kw', name: 'Kuwait' },
  { code: 'lb', name: 'Lebanon' },
  { code: 'mx', name: 'Mexico' },
  { code: 'my', name: 'Malaysia' },
  { code: 'nl', name: 'Netherlands' },
  { code: 'no', name: 'Norway' },
  { code: 'nz', name: 'New Zealand' },
  { code: 'om', name: 'Oman' },
  { code: 'ph', name: 'Philippines' },
  { code: 'pk', name: 'Pakistan' },
  { code: 'pl', name: 'Poland' },
  { code: 'pt', name: 'Portugal' },
  { code: 'qa', name: 'Qatar' },
  { code: 'ro', name: 'Romania' },
  { code: 'ru', name: 'Russia' },
  { code: 'sa', name: 'Saudi Arabia' },
  { code: 'se', name: 'Sweden' },
  { code: 'sg', name: 'Singapore' },
  { code: 'sy', name: 'Syria' },
  { code: 'th', name: 'Thailand' },
  { code: 'tr', name: 'Turkey' },
  { code: 'tw', name: 'Taiwan' },
  { code: 'ua', name: 'Ukraine' },
  { code: 'us', name: 'United States' },
  { code: 'vn', name: 'Vietnam' },
  { code: 'ye', name: 'Yemen' },
  { code: 'za', name: 'South Africa' },
];

// Time range options
const TIME_RANGES = [
  { value: 'any', label: 'Any time' },
  { value: 'day', label: 'Past 24 hours' },
  { value: 'week', label: 'Past week' },
  { value: 'month', label: 'Past month' },
  { value: 'year', label: 'Past year' },
];

export const SearchForm: React.FC<SearchFormProps> = ({ initialRequest, initialQuery, initialSearchOptions, initialNumResults, beta }) => {
  const [query, setQuery] = useState(initialQuery || initialRequest?.query || '');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchResult, setSearchResult] = useState<SearchRequest | null>(null);
  // Country filtering handled by ComboboxComponent

  // Convert API SearchOptions to form options structure
  const getInitialFormOptions = () => {
    if (initialSearchOptions) {
      return {
        language: initialSearchOptions.language || '',
        timeRange: initialSearchOptions.time_range || TimeRange.Any,
        numResults: initialNumResults || 5, // Use result_limit from request if available
        country: initialSearchOptions.country || '',
        depth: initialSearchOptions.depth || Depth.Basic,
      };
    }

    if (initialRequest?.search_options) {
      return {
        language: initialRequest.search_options.language || '',
        timeRange: initialRequest.search_options.time_range || TimeRange.Any,
        numResults: initialRequest.result_limit || 5,
        country: initialRequest.search_options.country || '',
        depth: initialRequest.search_options.depth || Depth.Basic,
      };
    }

    return {
      language: '',
      timeRange: TimeRange.Any,
      numResults: 5,
      country: '',
      depth: Depth.Basic,
    };
  };

  const [searchOptions, setSearchOptions] = useState(() => getInitialFormOptions());



  // Handle downloading search results
  const handleDownloadResults = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (searchResult?.uuid) {
      try {
        // Since the download function isn't implemented in the API yet, we'll create a download from the current results
        if (searchResult.result && Array.isArray(searchResult.result)) {
          const jsonString = JSON.stringify(searchResult.result, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `search_results_${searchResult.uuid}.json`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Results downloaded successfully');
        } else {
          toast.error('No results available to download');
        }
      } catch (error) {
        console.error('Error downloading results:', error);
        toast.error('Failed to download results.');
      }
    }
  };

  // Define tabs for tab panel
  const tabs = [
    {
      name: 'Search Options',
      content: (
        <div className="p-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Language */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Language
              </label>
              <ComboboxComponent
                items={LANGUAGES.map(lang => ({
                  id: lang.code,
                  label: lang.name
                }))}
                value={searchOptions.language}
                onChange={(value) => handleOptionChange('language', value)}
                placeholder="Any language"
              />
            </div>

            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Country
              </label>
              <ComboboxComponent
                items={COUNTRIES.map(country => ({
                  id: country.code,
                  label: country.name
                }))}
                value={searchOptions.country}
                onChange={(value) => handleOptionChange('country', value)}
                placeholder="Any country"
              />
            </div>

            {/* Time Range */}
            <div>
              <label htmlFor="timeRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Range
              </label>
              <select
                id="timeRange"
                value={searchOptions.timeRange}
                onChange={(e) => handleOptionChange('timeRange', e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                {TIME_RANGES.map((timeRange) => (
                  <option key={timeRange.value} value={timeRange.value}>
                    {timeRange.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Number of Results */}
            <div>
              <label htmlFor="numResults" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Number of Results
              </label>
              <input
                type="number"
                id="numResults"
                min={5}
                max={20}
                value={searchOptions.numResults}
                onChange={(e) => handleOptionChange('numResults', parseInt(e.target.value, 10))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            {/* Search Depth */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Search Depth
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleOptionChange('depth', Depth.Basic)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm 
                    ${searchOptions.depth === Depth.Basic 
                      ? 'bg-primary-600 text-white border-primary-700 dark:bg-primary-700 dark:text-white dark:border-primary-800' 
                      : 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'} 
                    border hover:bg-opacity-90 transition-all`}
                >
                  <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                  <div>
                    <span>Basic</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleOptionChange('depth', Depth.Advanced)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm 
                    ${searchOptions.depth === Depth.Advanced 
                      ? 'bg-primary-600 text-white border-primary-700 dark:bg-primary-700 dark:text-white dark:border-primary-800' 
                      : 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'} 
                    border hover:bg-opacity-90 transition-all`}
                >
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></div>
                  <div>
                    <span>Advanced</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleOptionChange('depth', Depth.Ultimate)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm 
                    ${searchOptions.depth === Depth.Ultimate 
                      ? 'bg-primary-600 text-white border-primary-700 dark:bg-primary-700 dark:text-white dark:border-primary-800' 
                      : 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'} 
                    border hover:bg-opacity-90 transition-all`}
                >
                  <div className="w-2 h-2 rounded-full bg-red-400 mr-2"></div>
                  <div>
                    <span>Ultimate</span>
                  </div>
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select the depth of search to control the quality and comprehensiveness of results
              </p>
              <div className="mt-3 space-y-2 bg-gray-50 dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Credit Usage & Speed:</p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Basic:</span> 1 credit per 5 results 
                      <span className="ml-1 text-xs text-green-600 dark:text-green-400">(Fast response)</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Advanced:</span> 2 credits per 5 results
                      <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400">(Moderate speed)</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Ultimate:</span> 1 credit per result
                      <span className="ml-1 text-xs text-red-600 dark:text-red-400">(Slower, more thorough)</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      name: 'API Documentation',
      content: (
        <div className="w-full">
          <SearchApiDocumentation 
            query={query}
            options={searchOptions}
          />
        </div>
      )
    },
    {
      name: 'Results',
      content: (
        <div className="p-4 space-y-4">
          {searchResult ? (
            <SearchResultDisplay
              results={Array.isArray(searchResult.result) ? searchResult.result : []}
              loading={searchResult.status === SearchStatus.Running}
              onDownload={handleDownloadResults}
            />
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No results yet. Perform a search to see results here.
            </div>
          )}
        </div>
      ),
    },
  ];

  // Initialize form state from initialRequest
  useEffect(() => {
    if (initialRequest && !query) {
      setQuery(initialRequest.query || '');
      if (initialRequest.search_options) {
        const { language, country, depth } = initialRequest.search_options;
        setSearchOptions(prev => ({
          ...prev,
          language: language || '',
          country: country || '',
          numResults: initialRequest.result_limit || 5,
          depth: depth || Depth.Basic
        }));
      }
    }
  }, [initialRequest, query]);

  const handleOptionChange = (option: string, value: any) => {
    setSearchOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const handleSearchEvent = async (event: any) => {
    if (event.type === 'state') {
      const request = event.data;

      setSearchResult(request);

      // If the search is finished or failed, fetch results and stop checking
      if (request.status === SearchStatus.Finished || request.status === SearchStatus.Failed) {
        // Fetch the final results
        const finalRequest = await searchApi.get(request.uuid);
        setSearchResult(finalRequest);
      }
    }
  };

  // Start a new search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsLoading(true);
    try {
      const searchRequest: SearchRequest = {
        query,
        search_options: {
          language: searchOptions.language || undefined,
          country: searchOptions.country || undefined,
          time_range: searchOptions.timeRange || undefined,
          search_type: SearchType.Web,
          depth: searchOptions.depth
        },
        result_limit: searchOptions.numResults
      };

      const response = await searchApi.create(searchRequest);

      // Set current search state
      setSearchResult(response);

      // change tab to results
      setSelectedTab(2);

      // Start checking status
      if (response.uuid) {
        await searchApi.subscribeToStatus(
          response.uuid,
          handleSearchEvent,
          () => setIsLoading(false)
        );
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || 'Failed to start search.');
      } else {
        toast.error('Failed to start search.');
      }
      console.error('Error starting search:', error);
      setIsLoading(false);
    }
  };

  // Cancel a running search
  const handleCancel = async () => {
    if (searchResult?.uuid) {
      setIsLoading(true);
      try {
        await searchApi.delete(searchResult.uuid);
        toast.success('Search canceled');
        // Refresh the search state to show cancelled
        const updatedRequest = await searchApi.get(searchResult.uuid);
        setSearchResult(updatedRequest);
      } catch (error) {
        console.error('Error canceling search:', error);
        toast.error('Failed to cancel search.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSearch} className="space-y-6">
      {/* Title Section */}
      {beta && (
        <div className="bg-orange-100 dark:bg-orange-900 border border-orange-500 dark:border-orange-700 text-orange-700 dark:text-orange-300 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-medium">
            Beta Version
          </h2>
          <p className="text-sm">
            This is a beta version of the search feature. Please report any issues or feedback to help us improve.
          </p>
        </div>
      )}
      {/* Search Input and Start Button */}
      <div className="space-y-2">
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 items-start">
          <div className="w-full">
            <FormInput
              label=""
              value={query}
              onChange={setQuery}
              type="text"
              placeholder="Enter your search query..."
              className="w-full text-lg"
            />
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 hidden md:block">
              Enter your query to search the internet for relevant results.
            </p>
          </div>
          <div className="w-full pt-1">
            {searchResult?.status === SearchStatus.Running ? (
              <button
                type="button"
                onClick={handleCancel}
                className="w-full md:w-auto px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Cancel Search
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Searching...' : 'Start Search'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Options Tabs */}
      <div>
        <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab}>
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide">
              <TabList className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 min-w-max">
                {tabs.map((tab) => (
                  <Tab
                    key={tab.name}
                    className={({ selected }) =>
                      classNames(
                        'px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none',
                        selected
                          ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                        (tab.name === 'Results' && ((searchResult?.result && searchResult?.result.length > 0) || (searchResult?.result?.length || 0) > 0))
                          ? 'text-primary-600 dark:text-primary-400'
                          : ''
                      )
                    }
                  >
                    {tab.name}
                  </Tab>
                ))}
              </TabList>
            </div>
          </div>
          <TabPanels className="mt-4">
            {tabs.map((tab, idx) => (
              <TabPanel
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm"
              >
                {tab.content}
              </TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      </div>
    </form>
  );
};
