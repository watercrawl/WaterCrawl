import React, { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { FormInput, InfoTooltip, OptionGroup } from '../shared/FormComponents';
import { Button } from '../shared/Button';
import { Link } from 'react-router-dom';
import { proxyApi } from '../../services/api/proxy';
import { UsableProxy } from '../../types/proxy';
import ComboboxComponent from '../shared/ComboboxComponent';
import { useTeam } from '../../contexts/TeamContext';
import { capFirst } from '../../utils/formatters';
export interface SpiderOptions {
  maxDepth: string;
  pageLimit: string;
  allowedDomains: string[];
  excludePaths: string[];
  includePaths: string[];
  proxy_server: string | null;
}

interface BatchSpiderOptions {
  proxy_server: string | null;
}

interface SpiderOptionsFormProps {
  options: SpiderOptions | BatchSpiderOptions;
  onChange: (options: Partial<SpiderOptions>) => void;
  isBatchMode?: boolean;
}

export const SpiderOptionsForm: React.FC<SpiderOptionsFormProps> = ({ options, onChange, isBatchMode }) => {
  const [newExcludePath, setNewExcludePath] = useState('');
  const [newIncludePath, setNewIncludePath] = useState('');
  const [newAllowedDomain, setNewAllowedDomain] = useState('');
  const [availableProxies, setAvailableProxies] = useState<UsableProxy[]>([]);
  const [isLoadingProxies, setIsLoadingProxies] = useState(false);
  const { currentSubscription } = useTeam();

  // Fetch available proxies
  useEffect(() => {
    const fetchProxies = async () => {
      setIsLoadingProxies(true);
      try {
        const proxies = await proxyApi.all();
        setAvailableProxies(proxies);
      } catch (error) {
        console.error('Error fetching proxies:', error);
      } finally {
        setIsLoadingProxies(false);
      }
    };

    fetchProxies();
  }, []);

  const excludePaths = isBatchMode ? [] : (options as SpiderOptions).excludePaths;
  const includePaths = isBatchMode ? [] : (options as SpiderOptions).includePaths;
  const allowedDomains = isBatchMode ? [] : (options as SpiderOptions).allowedDomains;

  const handleInputChange = (name: keyof SpiderOptions, value: string) => {
    onChange({ [name]: value });
  };

  const handleAddExcludePath = () => {
    if (newExcludePath.trim()) {
      onChange({ excludePaths: [...excludePaths, newExcludePath.trim()] });
      setNewExcludePath('');
    }
  };

  const handleRemoveExcludePath = (pathToRemove: string) => {
    const updatedPaths = excludePaths.filter(path => path !== pathToRemove);
    onChange({ excludePaths: updatedPaths });
  };

  const handleAddIncludePath = () => {
    if (newIncludePath.trim()) {
      onChange({ includePaths: [...includePaths, newIncludePath.trim()] });
      setNewIncludePath('');
    }
  };

  const handleRemoveIncludePath = (pathToRemove: string) => {
    const updatedPaths = includePaths.filter(path => path !== pathToRemove);
    onChange({ includePaths: updatedPaths });
  };

  const handleAddAllowedDomain = () => {
    if (newAllowedDomain.trim()) {
      onChange({ allowedDomains: [...allowedDomains, newAllowedDomain.trim()] });
      setNewAllowedDomain('');
    }
  };

  const handleRemoveAllowedDomain = (domainToRemove: string) => {
    const updatedDomains = allowedDomains.filter(domain => domain !== domainToRemove);
    onChange({ allowedDomains: updatedDomains });
  };

  const handleProxyChange = (value: string) => {
    onChange({ proxy_server: value || undefined });
  };

  const getCategoryText = (category: string) => {
    if (category.toLowerCase() === 'premium') {
      return 'Premium (Just for paid plans)';
    }
    return capFirst(category);
  };

  return (
    <div>
      {/* Two column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Left Column - Crawler Settings */}
        <div>
          <OptionGroup
            title="Crawler Settings"
            subtitle={isBatchMode ? (<small className="text-red-500 dark:text-red-400">(This option is not available in batch mode)</small>) : ''}
            description="Configure how deep and wide the crawler should go"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center space-x-1 mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Max Depth
                    </label>
                    <InfoTooltip content="Maximum depth of pages to crawl from the starting URL" />
                  </div>
                  <FormInput
                    label=""
                    type="number"
                    value={isBatchMode ? 'Auto' : (options as SpiderOptions).maxDepth}
                    disabled={isBatchMode}
                    onChange={(value) => handleInputChange('maxDepth', value)}
                    placeholder={isBatchMode ? 'Auto' : '1'}
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-1 mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Page Limit
                    </label>
                    <InfoTooltip content="Maximum number of pages to crawl" />
                  </div>
                  <FormInput
                    label=""
                    type="number"
                    value={isBatchMode ? 'Auto' : (options as SpiderOptions).pageLimit}
                    disabled={isBatchMode}
                    onChange={(value) => handleInputChange('pageLimit', value)}
                    placeholder={isBatchMode ? 'Auto' : '1'}
                  />
                </div>
              </div>



              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Allowed Domains
                  </label>
                  <InfoTooltip content="Specify domains to crawl (e.g., example.com, sub.example.com). Leave empty to crawl all domains." />
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 flex space-x-2">
                      <FormInput
                        label=""
                        value={newAllowedDomain}
                        onChange={setNewAllowedDomain}
                        placeholder={isBatchMode ? 'Auto' : 'eg. example.com'}
                        disabled={isBatchMode}
                        className="flex-grow"
                      />
                      <Button
                        type="button"
                        onClick={handleAddAllowedDomain}
                        disabled={!newAllowedDomain.trim()}
                        variant="outline"
                        size="sm"
                        className="!px-3 !py-2 h-[40px] mt-1"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
                {allowedDomains.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {allowedDomains.map((domain) => (
                      <span
                        key={domain}
                        className="inline-flex items-center bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs"
                      >
                        {domain}
                        <button
                          onClick={() => handleRemoveAllowedDomain(domain)}
                          className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </OptionGroup>
        </div>

        {/* Right Column - Path Filters */}
        <div className="space-y-6">
          <OptionGroup
            title="Path Filters"
            subtitle={isBatchMode ? (<small className="text-red-500 dark:text-red-400">(This option is not available in batch mode)</small>) : ''}
            description="Specify which paths to include or exclude from crawling"
          >
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Exclude Paths
                  </label>
                  <InfoTooltip content="Specify paths to exclude from crawling (e.g., */admin/* or /login/*). Each rule must start with * or /. Use * as a wildcard to match any number of characters, or omit * for an exact match." />
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 flex space-x-2">
                      <FormInput
                        label=""
                        value={newExcludePath}
                        onChange={setNewExcludePath}
                        disabled={isBatchMode}
                        placeholder={isBatchMode ? 'Auto' : 'eg. /login/*, '}
                        className="flex-grow"
                      />
                      <Button
                        type="button"
                        onClick={handleAddExcludePath}
                        disabled={!newExcludePath.trim()}
                        variant="outline"
                        size="sm"
                        className="!px-3 !py-2 h-[40px] mt-1"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
                {excludePaths.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {excludePaths.map((path) => (
                      <span
                        key={path}
                        className="inline-flex items-center bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs"
                      >
                        {path}
                        <button
                          onClick={() => handleRemoveExcludePath(path)}
                          className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Include Paths
                  </label>
                  <InfoTooltip content="Specify paths to include in crawling (e.g., /blog/*, *docs*). Each rule must start with * or /. Use * as a wildcard to match any number of characters, or omit * for an exact match." />
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 flex space-x-2">
                      <FormInput
                        label=""
                        value={newIncludePath}
                        onChange={setNewIncludePath}
                        disabled={isBatchMode}
                        placeholder={isBatchMode ? 'Auto' : 'eg. /blog/*, *docs*'}
                        className="flex-grow"
                      />
                      <Button
                        type="button"
                        onClick={handleAddIncludePath}
                        disabled={!newIncludePath.trim()}
                        variant="outline"
                        size="sm"
                        className="!px-3 !py-2 h-[40px] mt-1"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
                {includePaths.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {includePaths.map((path) => (
                      <span
                        key={path}
                        className="inline-flex items-center bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs"
                      >
                        {path}
                        <button
                          onClick={() => handleRemoveIncludePath(path)}
                          className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </OptionGroup>
        </div>
        <div>
          <OptionGroup
            title="Proxy Settings"
            description="Configure proxy servers for your crawl requests"
          >
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Proxy Server
                  </label>
                  <InfoTooltip content="Select a proxy server to use for crawling" />
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="relative">
                    {isLoadingProxies ? (
                      <div className="w-full h-10 px-3 flex items-center border border-gray-200 dark:border-gray-700 rounded-md text-gray-500 dark:text-gray-400">
                        Loading proxies...
                      </div>
                    ) : (
                      <ComboboxComponent
                        value={options.proxy_server || ''}
                        onChange={handleProxyChange}
                        placeholder="Use default proxies"
                        items={availableProxies.map(proxy => ({
                          id: proxy.slug,
                          label: proxy.name,
                          category: getCategoryText(proxy.category),
                          disabled: currentSubscription?.is_default && proxy.category.toLowerCase() === 'premium'
                        }))}
                      />
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                    <span>Need to add a proxy?</span>
                    <Link to="/dashboard/settings#proxy" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center">
                      Manage proxies
                      <ArrowTopRightOnSquareIcon className="ml-1 h-3 w-3" />
                    </Link>
                  </div>

                  {/* Subscription Information Box */}
                  {currentSubscription?.is_default && (
                    <div className="mt-3 space-y-2 bg-gray-50 dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Proxy Access by Subscription:</p>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Free Subscription:</span> Access to Team and General proxies
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0"></div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Startup+ Plans:</span> Additional access to Premium Residential proxies
                            <a href="/dashboard/plans" className="ml-1 text-xs text-blue-600 dark:text-blue-400">Upgrade to Startup Plan</a>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </OptionGroup>
        </div>
      </div>

    </div>
  );
};
