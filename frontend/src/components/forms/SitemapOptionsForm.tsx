import React, { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next'; 
import { Link } from 'react-router-dom';

import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

import ArrayStringField from '../shared/ArrayStringField';
import ComboboxComponent from '../shared/ComboboxComponent';
import { FormInput, InfoTooltip, OptionGroup } from '../shared/FormComponents';
import { Switch } from '../shared/Switch';

import { useTeam } from '../../contexts/TeamContext';
import { proxyApi } from '../../services/api/proxy';
import { UsableProxy } from '../../types/proxy';
import { SitemapOptions } from '../../types/sitemap';
import { capFirst } from '../../utils/formatters';

interface SitemapOptionsFormProps {
  options: SitemapOptions;
  onChange: (options: Partial<SitemapOptions>) => void;
}

export const SitemapOptionsForm: React.FC<SitemapOptionsFormProps> = ({ options, onChange }) => {
  const { t } = useTranslation();
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
  const handleToggleChange = (
    name: 'include_subdomains' | 'ignore_sitemap_xml',
    value: boolean
  ) => {
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
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {/* Left Column - Basic Settings */}
        <div>
          <OptionGroup
            title={t('sitemap.options.generalSettings')}
            description={t('sitemap.options.generalSettingsDesc')}
          >
            <div className="space-y-4">
              <div className="flex items-center">
                <Switch
                  label={t('sitemap.options.includeSubdomains')}
                  description={t('sitemap.options.includeSubdomainsDesc')}
                  checked={includeSubdomains}
                  onChange={checked => handleToggleChange('include_subdomains', checked)}
                />
              </div>

              <div className="flex items-center">
                <Switch
                  label={t('sitemap.options.ignoreSitemapXml')}
                  description={t('sitemap.options.ignoreSitemapXmlDesc')}
                  checked={ignoreSitemapXml}
                  onChange={checked => handleToggleChange('ignore_sitemap_xml', checked)}
                />
              </div>

              {/* Search filter */}
              <div className="space-y-2">
                <div className="mb-1 flex items-center gap-x-1">
                  <label className="block text-sm font-medium text-foreground">
                    {t('sitemap.options.searchFilter')}
                  </label>
                  <InfoTooltip content={t('sitemap.options.searchFilterDesc')} />
                </div>
                <FormInput
                  label=""
                  value={searchTerm || ''}
                  onChange={handleSearchChange}
                  type="text"
                  placeholder={t('sitemap.options.searchFilterPlaceholder')}
                />
              </div>
            </div>
          </OptionGroup>
        </div>

        {/* Right Column - Path Settings */}
        <div>
          <OptionGroup
            title={t('sitemap.options.pathFilters')}
            description={t('sitemap.options.pathFiltersDesc')}
          >
            <div className="space-y-4">
              {/* Include paths */}
              <ArrayStringField
                label={t('crawl.spiderOptions.includePaths')}
                tooltipContent={t('crawl.spiderOptions.includePathsTooltip')}
                values={includePaths}
                onChange={handleIncludePathsChange}
                placeholder="/path/to/include"
                className="mb-4"
              />

              {/* Exclude paths */}
              <ArrayStringField
                label={t('crawl.spiderOptions.excludePaths')}
                tooltipContent={t('crawl.spiderOptions.excludePathsTooltip')}
                values={excludePaths}
                onChange={handleExcludePathsChange}
                placeholder="/path/to/exclude"
                className="mb-4"
              />
            </div>
          </OptionGroup>
        </div>

        <div className="mt-4">
          <OptionGroup
            title={t('crawl.spiderOptions.proxySettings')}
            description={t('crawl.spiderOptions.proxySettingsDesc')}
          >
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center gap-x-1">
                  <label className="block text-sm font-medium text-foreground">
                    {t('crawl.spiderOptions.proxyServer')}
                  </label>
                  <InfoTooltip content={t('crawl.spiderOptions.proxyServerTooltip')} />
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="relative">
                    {isLoadingProxies ? (
                      <div className="flex h-10 w-full items-center rounded-md border border-border px-3 text-muted-foreground">
                        {t('crawl.spiderOptions.loadingProxies')}
                      </div>
                    ) : (
                      <ComboboxComponent
                        value={options.proxy_server || ''}
                        onChange={handleProxyChange}
                        placeholder={t('crawl.spiderOptions.useDefaultProxies')}
                        items={availableProxies.map(proxy => ({
                          id: proxy.slug,
                          label: proxy.name,
                          category: getCategoryText(proxy.category),
                          disabled:
                            currentSubscription?.is_default &&
                            proxy.category.toLowerCase() === 'premium',
                        }))}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-x-1 text-sm text-muted-foreground">
                    <span>{t('crawl.spiderOptions.needProxy')}</span>
                    <Link
                      to="/dashboard/settings#proxy"
                      className="inline-flex items-center text-primary hover:text-primary-strong"
                    >
                      {t('crawl.spiderOptions.manageProxies')}
                      <ArrowTopRightOnSquareIcon className="ms-1 h-3 w-3" />
                    </Link>
                  </div>

                  {/* Subscription Information Box */}
                  {currentSubscription?.is_default && (
                    <div className="mt-3 space-y-2 rounded-md border border-border bg-muted p-3">
                      <p className="text-xs font-medium text-foreground">
                        {t('crawl.spiderOptions.proxyAccessTitle')}
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center gap-x-2">
                          <div className="h-2 w-2 flex-shrink-0 rounded-full bg-success"></div>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">
                              {t('crawl.spiderOptions.freeSubscription')}
                            </span>{' '}
                            {t('crawl.spiderOptions.freeProxyAccess')}
                          </p>
                        </div>
                        <div className="flex items-center gap-x-2">
                          <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary"></div>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">
                              {t('crawl.spiderOptions.startupPlans')}
                            </span>{' '}
                            {t('crawl.spiderOptions.premiumProxyAccess')}
                            <a href="/dashboard/plans" className="ms-1 text-xs text-primary">
                              {t('crawl.spiderOptions.upgradeToStartup')}
                            </a>
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
