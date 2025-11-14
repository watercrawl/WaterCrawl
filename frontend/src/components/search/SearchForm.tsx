import React, { useState, useEffect } from 'react';

import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { AxiosError } from 'axios';

import ComboboxComponent from '../shared/ComboboxComponent';
import Feed from '../shared/Feed';
import { FormInput } from '../shared/FormComponents';

import { useSettings } from '../../contexts/SettingsProvider';
import { searchApi } from '../../services/api/search';
import { FeedMessage } from '../../types/feed';
import {
  SearchRequest,
  SearchStatus,
  SearchType,
  SearchOptions,
  Depth,
  TimeRange,
  SearchEvent,
} from '../../types/search';

import { SearchApiDocumentation } from './SearchApiDocumentation';
import { SearchResultDisplay } from './SearchResultDisplay';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface SearchFormProps {
  initialRequest?: SearchRequest | null;
  initialQuery?: string;
  initialSearchOptions?: SearchOptions;
  initialNumResults?: number;
}

// List of available languages for search
// add flag to each language
const LANGUAGES = [
  { code: 'ar', name: '🇦🇪 Arabic' },
  { code: 'bn', name: '🇧🇩 Bengali' },
  { code: 'cs', name: '🇨🇿 Czech' },
  { code: 'da', name: '🇩🇰 Danish' },
  { code: 'de', name: '🇩🇪 German' },
  { code: 'el', name: '🇬🇷 Greek' },
  { code: 'en', name: '🇬🇧 English' },
  { code: 'es', name: '🇪🇸 Spanish' },
  { code: 'fa', name: '🇮🇷 Persian' },
  { code: 'fi', name: '🇫🇮 Finnish' },
  { code: 'fr', name: '🇫🇷 French' },
  { code: 'he', name: '🇮🇱 Hebrew' },
  { code: 'hi', name: '🇮🇳 Hindi' },
  { code: 'hu', name: '🇭🇺 Hungarian' },
  { code: 'id', name: '🇮🇩 Indonesian' },
  { code: 'it', name: '🇮🇹 Italian' },
  { code: 'ja', name: '🇯🇵 Japanese' },
  { code: 'ko', name: '🇰🇷 Korean' },
  { code: 'ms', name: '🇲🇾 Malay' },
  { code: 'nl', name: '🇳🇱 Dutch' },
  { code: 'no', name: '🇳🇴 Norwegian' },
  { code: 'pl', name: '🇵🇱 Polish' },
  { code: 'pt', name: '🇵🇹 Portuguese' },
  { code: 'ro', name: '🇷🇴 Romanian' },
  { code: 'ru', name: '🇷🇺 Russian' },
  { code: 'sv', name: '🇸🇪 Swedish' },
  { code: 'th', name: '🇹🇭 Thai' },
  { code: 'tr', name: '🇹🇷 Turkish' },
  { code: 'uk', name: '🇺🇦 Ukrainian' },
  { code: 'ur', name: '🇵🇰 Urdu' },
  { code: 'vi', name: '🇻🇳 Vietnamese' },
  { code: 'zh', name: '🇨🇳 Chinese' },
];

// List of countries for search filtering
const COUNTRIES = [
  { code: 'ae', name: '🇦🇪 United Arab Emirates' },
  { code: 'af', name: '🇦🇫 Afghanistan' },
  { code: 'at', name: '🇦🇹 Austria' },
  { code: 'au', name: '🇦🇺 Australia' },
  { code: 'be', name: '🇧🇪 Belgium' },
  { code: 'bg', name: '🇧🇬 Bulgaria' },
  { code: 'br', name: '🇧🇷 Brazil' },
  { code: 'ca', name: '🇨🇦 Canada' },
  { code: 'ch', name: '🇨🇭 Switzerland' },
  { code: 'cn', name: '🇨🇳 China' },
  { code: 'cz', name: '🇨🇿 Czech Republic' },
  { code: 'de', name: '🇩🇪 Germany' },
  { code: 'dk', name: '🇩🇰 Denmark' },
  { code: 'eg', name: '🇪🇬 Egypt' },
  { code: 'es', name: '🇪🇸 Spain' },
  { code: 'fi', name: '🇫🇮 Finland' },
  { code: 'fr', name: '🇫🇷 France' },
  { code: 'gb', name: '🇬🇧 United Kingdom' },
  { code: 'gr', name: '🇬🇷 Greece' },
  { code: 'hk', name: '🇭🇰 Hong Kong' },
  { code: 'hu', name: '🇭🇺 Hungary' },
  { code: 'id', name: '🇮🇩 Indonesia' },
  { code: 'ie', name: '🇮🇪 Ireland' },
  { code: 'il', name: '🇮🇱 Israel' },
  { code: 'in', name: '🇮🇳 India' },
  { code: 'iq', name: '🇮🇶 Iraq' },
  { code: 'ir', name: '🇮🇷 Iran' },
  { code: 'it', name: '🇮🇹 Italy' },
  { code: 'jo', name: '🇯🇴 Jordan' },
  { code: 'jp', name: '🇯🇵 Japan' },
  { code: 'kr', name: '🇰🇷 South Korea' },
  { code: 'kw', name: '🇰🇼 Kuwait' },
  { code: 'lb', name: '🇱🇧 Lebanon' },
  { code: 'mx', name: '🇲🇽 Mexico' },
  { code: 'my', name: '🇲🇾 Malaysia' },
  { code: 'nl', name: '🇳🇱 Netherlands' },
  { code: 'no', name: '🇳🇴 Norway' },
  { code: 'nz', name: '🇳🇿 New Zealand' },
  { code: 'om', name: '🇴🇲 Oman' },
  { code: 'ph', name: '🇵🇭 Philippines' },
  { code: 'pk', name: '🇵🇰 Pakistan' },
  { code: 'pl', name: '🇵🇱 Poland' },
  { code: 'pt', name: '🇵🇹 Portugal' },
  { code: 'qa', name: '🇶🇦 Qatar' },
  { code: 'ro', name: '🇷🇴 Romania' },
  { code: 'ru', name: '🇷🇺 Russia' },
  { code: 'sa', name: '🇸🇦 Saudi Arabia' },
  { code: 'se', name: '🇸🇪 Sweden' },
  { code: 'sg', name: '🇸🇬 Singapore' },
  { code: 'sy', name: '🇸🇾 Syria' },
  { code: 'th', name: '🇹🇭 Thailand' },
  { code: 'tr', name: '🇹🇷 Turkey' },
  { code: 'tw', name: '🇹🇼 Taiwan' },
  { code: 'ua', name: '🇺🇦 Ukraine' },
  { code: 'us', name: '🇺🇸 United States' },
  { code: 'vn', name: '🇻🇳 Vietnam' },
  { code: 'ye', name: '🇾🇪 Yemen' },
  { code: 'za', name: '🇿🇦 South Africa' },
];

// Time range options - will be translated in component
const TIME_RANGES = [
  { value: 'any', key: 'search.timeRange.any' },
  { value: 'day', key: 'search.timeRange.day' },
  { value: 'week', key: 'search.timeRange.week' },
  { value: 'month', key: 'search.timeRange.month' },
  { value: 'year', key: 'search.timeRange.year' },
];

export const SearchForm: React.FC<SearchFormProps> = ({
  initialRequest,
  initialQuery,
  initialSearchOptions,
  initialNumResults,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery || initialRequest?.query || '');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchResult, setSearchResult] = useState<SearchRequest | null>(null);
  const [feedMessages, setFeedMessages] = useState<FeedMessage[]>([]);
  const { settings } = useSettings();
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
          toast.success(t('search.downloadSuccess'));
        } else {
          toast.error(t('search.noResults'));
        }
      } catch (error) {
        console.error('Error downloading results:', error);
        toast.error(t('search.downloadFailed'));
      }
    }
  };

  // Define tabs for tab panel
  const tabs = [
    {
      name: t('search.tabs.options'),
      content: (
        <div className="rounded-lg border border-border bg-card">
          <div className="space-y-6 p-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Language */}
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-foreground">
                  {t('search.language')}
                </label>
                <ComboboxComponent
                  items={LANGUAGES.map(lang => ({
                    id: lang.code,
                    label: lang.name,
                  }))}
                  value={searchOptions.language}
                  onChange={value => handleOptionChange('language', value)}
                  placeholder={t('search.anyLanguage')}
                />
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-foreground">
                  {t('search.country')}
                </label>
                <ComboboxComponent
                  items={COUNTRIES.map(country => ({
                    id: country.code,
                    label: country.name,
                  }))}
                  value={searchOptions.country}
                  onChange={value => handleOptionChange('country', value)}
                  placeholder={t('search.anyCountry')}
                />
              </div>

              {/* Time Range */}
              <div>
                <label htmlFor="timeRange" className="block text-sm font-medium text-foreground">
                  {t('search.timeRange.label')}
                </label>
                <select
                  id="timeRange"
                  value={searchOptions.timeRange}
                  onChange={e => handleOptionChange('timeRange', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input-border bg-card py-2 pe-10 ps-3 text-base text-foreground focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                >
                  {TIME_RANGES.map(timeRange => (
                    <option key={timeRange.value} value={timeRange.value}>
                      {t(timeRange.key)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Results */}
              <div>
                <label htmlFor="numResults" className="block text-sm font-medium text-foreground">
                  {t('search.numResults')}
                </label>
                <input
                  type="number"
                  id="numResults"
                  min={5}
                  max={20}
                  value={searchOptions.numResults}
                  onChange={e => handleOptionChange('numResults', parseInt(e.target.value, 10))}
                  className="mt-1 block w-full rounded-md border border-input-border bg-input text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
                />
              </div>

              {/* Search Depth */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-foreground">
                  {t('search.depth.label')}
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleOptionChange('depth', Depth.Basic)}
                    className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm ${
                      searchOptions.depth === Depth.Basic
                        ? 'border-primary-strong bg-primary text-white'
                        : 'border-input-border bg-muted text-foreground'
                    } border transition-all hover:bg-opacity-90`}
                  >
                    <div className="me-2 h-2 w-2 rounded-full bg-success"></div>
                    <div>
                      <span>Basic</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOptionChange('depth', Depth.Advanced)}
                    className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm ${
                      searchOptions.depth === Depth.Advanced
                        ? 'border-primary-strong bg-primary text-white'
                        : 'border-input-border bg-muted text-foreground'
                    } border transition-all hover:bg-opacity-90`}
                  >
                    <div className="me-2 h-2 w-2 rounded-full bg-warning"></div>
                    <div>
                      <span>Advanced</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOptionChange('depth', Depth.Ultimate)}
                    className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm ${
                      searchOptions.depth === Depth.Ultimate
                        ? 'border-primary-strong bg-primary text-white'
                        : 'border-input-border bg-muted text-foreground'
                    } border transition-all hover:bg-opacity-90`}
                  >
                    <div className="me-2 h-2 w-2 rounded-full bg-error"></div>
                    <div>
                      <span>Ultimate</span>
                    </div>
                  </button>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('search.depth.description')}
                </p>
                {settings?.is_enterprise_mode_active && (
                  <div className="mt-3 space-y-2 rounded-md border border-border bg-muted p-3">
                    <p className="text-xs font-medium text-foreground">
                      {t('search.creditUsage.title')}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-x-2">
                        <div className="h-2 w-2 rounded-full bg-success"></div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">{t('search.depth.basic')}:</span>{' '}
                          {t('search.creditUsage.basic')}
                          <span className="ms-1 text-xs text-success">
                            ({t('search.speed.fast')})
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-x-2">
                        <div className="h-2 w-2 rounded-full bg-warning"></div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">{t('search.depth.advanced')}:</span>{' '}
                          {t('search.creditUsage.advanced')}
                          <span className="ms-1 text-xs text-warning">
                            ({t('search.speed.moderate')})
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-x-2">
                        <div className="h-2 w-2 rounded-full bg-error"></div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">{t('search.depth.ultimate')}:</span>{' '}
                          {t('search.creditUsage.ultimate')}
                          <span className="ms-1 text-xs text-error">
                            ({t('search.speed.slow')})
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      name: t('search.tabs.api'),
      content: (
        <div className="w-full">
          <SearchApiDocumentation query={query} options={searchOptions} />
        </div>
      ),
    },
    {
      name: t('search.tabs.results'),
      content: (
        <div className="space-y-4 p-4">
          {searchResult ? (
            <>
              <Feed
                messages={feedMessages}
                loading={searchResult.status === SearchStatus.Running}
                emptyMessage={t('search.noUpdates')}
                showTimestamp
              />
              <SearchResultDisplay
                results={Array.isArray(searchResult.result) ? searchResult.result : []}
                loading={searchResult.status === SearchStatus.Running}
                onDownload={handleDownloadResults}
              />
            </>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              {t('search.noResultsYet')}
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
          depth: depth || Depth.Basic,
        }));
      }
    }
  }, [initialRequest, query]);

  const handleOptionChange = (option: string, value: any) => {
    setSearchOptions(prev => ({
      ...prev,
      [option]: value,
    }));
  };

  const handleSearchEvent = async (event: SearchEvent) => {
    if (event.type === 'state') {
      const request = event.data as SearchRequest;

      setSearchResult(request);

      // If the search is finished or failed, fetch results and stop checking
      if (request.status === SearchStatus.Finished || request.status === SearchStatus.Failed) {
        // Fetch the final results
        const finalRequest = await searchApi.get(request.uuid || '');
        setSearchResult(finalRequest);
      }
    }

    if (event.type === 'feed') {
      const message = event.data as FeedMessage;
      setFeedMessages(prev => [...prev, message]);
    }
  };

  // Start a new search
  const handleSearch = async (e: React.FormEvent) => {
    setFeedMessages([]);
    e.preventDefault();
    if (!query.trim()) {
      toast.error(t('search.enterQuery'));
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
          depth: searchOptions.depth,
        },
        result_limit: searchOptions.numResults,
      };

      const response = await searchApi.create(searchRequest);

      // Set current search state
      setSearchResult(response);

      // change tab to results
      setSelectedTab(2);

      // Start checking status
      if (response.uuid) {
        await searchApi.subscribeToStatus(response.uuid, handleSearchEvent, () =>
          setIsLoading(false)
        );
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message || 'Failed to start search.');
      } else {
        toast.error(t('search.startFailed'));
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
        toast.success(t('search.canceled'));
        // Refresh the search state to show canceled
        const updatedRequest = await searchApi.get(searchResult.uuid);
        setSearchResult(updatedRequest);
      } catch (error) {
        console.error('Error canceling search:', error);
        toast.error(t('search.cancelFailed'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSearch} className="space-y-6">
      {/* Search Input and Start Button */}
      <div className="space-y-2">
        <div className="flex flex-col items-start space-y-4 md:flex-row md:gap-x-4 md:space-y-0">
          <div className="w-full">
            <FormInput
              label=""
              value={query}
              onChange={setQuery}
              type="text"
              placeholder={t('search.queryPlaceholder')}
              className="ltr w-full text-lg"
            />
            <p className="mt-1.5 hidden text-sm text-muted-foreground md:block">
              {t('search.queryDescription')}
            </p>
          </div>
          <div className="w-full pt-1">
            {searchResult?.status === SearchStatus.Running ? (
              <button
                type="button"
                onClick={handleCancel}
                className="w-full rounded-lg bg-error px-6 py-2.5 text-sm font-medium text-error-foreground transition-colors hover:bg-error-soft hover:text-error-strong focus:outline-none focus:ring-error focus:ring-offset-2 md:w-auto"
              >
                {t('search.cancelSearch')}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
              >
                {isLoading ? t('search.searching') : t('search.startSearch')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Options Tabs */}
      <div>
        <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab}>
          <div className="relative">
            <div className="scrollbar-hide overflow-x-auto">
              <TabList className="flex min-w-max gap-x-1 border-b border-border">
                {tabs.map(tab => (
                  <Tab
                    key={tab.name}
                    className={({ selected }: { selected: boolean }) =>
                      classNames(
                        'px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none',
                        selected
                          ? 'border-b-2 border-border text-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                        tab.name === 'Results' &&
                          ((searchResult?.result && searchResult?.result.length > 0) ||
                            (searchResult?.result?.length || 0) > 0)
                          ? 'text-primary'
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
              <TabPanel key={idx}>{tab.content}</TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      </div>
    </form>
  );
};
