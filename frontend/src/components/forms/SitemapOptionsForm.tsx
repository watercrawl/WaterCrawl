import React, { useState, useEffect } from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { FormInput, InfoTooltip, OptionGroup } from '../shared/FormComponents';
import { SitemapOptions } from '../../types/sitemap';
import ArrayStringField from '../shared/ArrayStringField';
import { Switch } from '../shared/Switch';
import { Link } from 'react-router-dom';
import { proxyApi } from '../../services/api/proxy';
import { UsableProxy } from '../../types/proxy';
import ComboboxComponent from '../shared/ComboboxComponent';
import { useTeam } from '../../contexts/TeamContext';
import { capFirst } from '../../utils/formatters';

interface SitemapOptionsFormProps {
  options: SitemapOptions;
  onChange: (options: Partial<SitemapOptions>) => void;
}

export const SitemapOptionsForm: React.FC<SitemapOptionsFormProps> = ({ options, onChange }) => {
  const [searchTerm, setSearchTerm] = useState(options.search || '');
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

  // Get current values
  const includeSubdomains = options.include_subdomains;
  const ignoreSitemapXml = options.ignore_sitemap_xml;
  const includePaths = options.include_paths || [];
  const excludePaths = options.exclude_paths || [];

  // Handle toggle changes
  const handleToggleChange = (name: 'include_subdomains' | 'ignore_sitemap_xml', value: boolean) => {
    onChange({ [name]: value });
  };

  // Handle search term change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onChange({ search: value || null });
  };

  // Handle include and exclude paths updates through the ArrayStringField component
  const handleIncludePathsChange = (updatedPaths: string[]) => {
    onChange({ include_paths: updatedPaths });
  };

  const handleExcludePathsChange = (updatedPaths: string[]) => {
    onChange({ exclude_paths: updatedPaths });
  };

  const handleProxyChange = (value: string) => {
    onChange({ proxy_server: value || null });
  };

  const getCategoryText = (category: string) => {
    return capFirst(category);
  };

  return (
    <div>
      {/* Two column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Left Column - Basic Settings */}
        <div>
          <OptionGroup
            title="Basic Settings"
            description="Configure how the sitemap generator should behave"
          >
            <div className="space-y-4">
              <div className="flex items-center">
                <Switch
                  label="Include subdomains"
                  description="When enabled, the sitemap will include URLs from subdomains of the main domain"
                  checked={includeSubdomains}
                  onChange={(checked) => handleToggleChange('include_subdomains', checked)}
                />
              </div>

              <div className="flex items-center">
                <Switch
                  label="Ignore sitemap.xml"
                  description="When enabled, the sitemap will ignore the sitemap.xml file and try to use other methods to generate a sitemap"
                  checked={ignoreSitemapXml}
                  onChange={(checked) => handleToggleChange('ignore_sitemap_xml', checked)}
                />
              </div>
              
              {/* Search filter */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1 mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Search term
                  </label>
                  <InfoTooltip content="Search term to filter pages. Leave empty to include all pages" />
                </div>
                <FormInput
                  label=""
                  value={searchTerm || ''}
                  onChange={handleSearchChange}
                  type="text"
                  placeholder="Enter search term (optional)"
                />
              </div>
            </div>
          </OptionGroup>
        </div>
        
        {/* Right Column - Path Settings */}
        <div>
          <OptionGroup
            title="Path Settings"
            description="Configure which paths to include or exclude in the sitemap"
          >
            <div className="space-y-4">
              {/* Include paths */}
              <ArrayStringField
                label="Include paths"
                tooltipContent="Specify paths to include in sitemap (e.g., */admin/* or /login/*). Each rule must start with * or /. Use * as a wildcard to match any number of characters, or omit * for an exact match."
                values={includePaths}
                onChange={handleIncludePathsChange}
                placeholder="/path/to/include"
                className="mb-4"
              />

              {/* Exclude paths */}
              <ArrayStringField
                label="Exclude paths"
                tooltipContent="Specify paths to exclude from crawling (e.g., */admin/* or /login/*). Each rule must start with * or /. Use * as a wildcard to match any number of characters, or omit * for an exact match."
                values={excludePaths}
                onChange={handleExcludePathsChange}
                placeholder="/path/to/exclude"
                className="mb-4"
              />
            </div>
          </OptionGroup>
        </div>
      </div>

      {/* Proxy Settings Section - Full Width */}
      <div className="mt-4">
        <OptionGroup
          title="Proxy Settings"
          description="Configure proxy servers for your sitemap requests"
        >
          <div className="space-y-4">
            <div>
              <div className="flex items-center space-x-1 mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Proxy Server
                </label>
                <InfoTooltip content="Select a proxy server to use for sitemap generation" />
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
  );
};
