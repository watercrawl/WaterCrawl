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
import { useSettings } from '../../contexts/SettingsProvider';
import { useTranslation } from 'react-i18next';
export interface SpiderOptions {
  maxDepth: string;
  pageLimit: string;
  concurrentRequests: string | null;
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

export const SpiderOptionsForm: React.FC<SpiderOptionsFormProps> = ({
  options,
  onChange,
  isBatchMode,
}) => {
  const { t } = useTranslation();
  const [newExcludePath, setNewExcludePath] = useState('');
  const [newIncludePath, setNewIncludePath] = useState('');
  const [newAllowedDomain, setNewAllowedDomain] = useState('');
  const [availableProxies, setAvailableProxies] = useState<UsableProxy[]>([]);
  const [isLoadingProxies, setIsLoadingProxies] = useState(false);
  const { currentSubscription } = useTeam();
  const { settings } = useSettings();

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
      return t('crawl.spiderOptions.premiumProxy');
    }
    return capFirst(category);
  };

  return (
    <div>
      {/* Two column section */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Left Column - Crawler Settings */}
        <OptionGroup
          title={t('crawl.spiderOptions.crawlerSettings')}
          subtitle={
            isBatchMode ? (
              <small className="text-error">({t('crawl.spiderOptions.notAvailableInBatch')})</small>
            ) : (
              ''
            )
          }
          description={t('crawl.spiderOptions.crawlerSettingsDesc')}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1 flex items-center gap-x-1">
                  <label className="block text-sm font-medium text-foreground">
                    {t('crawl.spiderOptions.maxDepth')}
                  </label>
                  <InfoTooltip content={t('crawl.spiderOptions.maxDepthTooltip')} />
                </div>
                <FormInput
                  label=""
                  type="number"
                  value={isBatchMode ? 'Auto' : (options as SpiderOptions).maxDepth}
                  disabled={isBatchMode}
                  onChange={value => handleInputChange('maxDepth', value)}
                  placeholder={isBatchMode ? 'Auto' : '1'}
                />
              </div>

              <div>
                <div className="mb-1 flex items-center gap-x-1">
                  <label className="block text-sm font-medium text-foreground">
                    {t('crawl.spiderOptions.pageLimit')}
                  </label>
                  <InfoTooltip content={t('crawl.spiderOptions.pageLimitTooltip')} />
                </div>
                <FormInput
                  label=""
                  type="number"
                  value={isBatchMode ? 'Auto' : (options as SpiderOptions).pageLimit}
                  disabled={isBatchMode}
                  onChange={value => handleInputChange('pageLimit', value)}
                  placeholder={isBatchMode ? 'Auto' : '1'}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center gap-x-1">
                <label className="block text-sm font-medium text-foreground">
                  {t('crawl.spiderOptions.concurrentRequests')}
                </label>
                <InfoTooltip content={t('crawl.spiderOptions.concurrentRequestsTooltip')} />
              </div>
              <FormInput
                label=""
                type="number"
                value={(options as SpiderOptions).concurrentRequests || ''}
                onChange={value => handleInputChange('concurrentRequests', value)}
                placeholder={`Auto - Maximum(${settings?.max_crawl_concurrency})`}
              />
              <small className="text-xs text-muted-foreground">
                {t('crawl.spiderOptions.concurrentRequestsHelp')}
              </small>
            </div>
          </div>
        </OptionGroup>

        <OptionGroup
          title={t('crawl.spiderOptions.pathFilters')}
          subtitle={
            isBatchMode ? (
              <small className="text-error">({t('crawl.spiderOptions.notAvailableInBatch')})</small>
            ) : (
              ''
            )
          }
          description={t('crawl.spiderOptions.pathFiltersDesc')}
        >
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center gap-x-1">
                <label className="block text-sm font-medium text-foreground">
                  {t('crawl.spiderOptions.excludePaths')}
                </label>
                <InfoTooltip content={t('crawl.spiderOptions.excludePathsTooltip')} />
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 flex gap-x-2">
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
                      className="mt-1 h-[40px] !px-3 !py-2"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
              {excludePaths.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {excludePaths.map(path => (
                    <span
                      key={path}
                      className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs"
                    >
                      {path}
                      <button
                        onClick={() => handleRemoveExcludePath(path)}
                        className="ms-1 text-muted-foreground hover:text-foreground"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-1 flex items-center gap-x-1">
                <label className="block text-sm font-medium text-foreground">
                  {t('crawl.spiderOptions.includePaths')}
                </label>
                <InfoTooltip content={t('crawl.spiderOptions.includePathsTooltip')} />
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 flex gap-x-2">
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
                      className="mt-1 h-[40px] !px-3 !py-2"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
              {includePaths.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {includePaths.map(path => (
                    <span
                      key={path}
                      className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs"
                    >
                      {path}
                      <button
                        onClick={() => handleRemoveIncludePath(path)}
                        className="ms-1 text-muted-foreground hover:text-foreground"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-1 flex items-center gap-x-1">
                <label className="block text-sm font-medium text-foreground">
                  {t('crawl.spiderOptions.allowedDomains')}
                </label>
                <InfoTooltip content={t('crawl.spiderOptions.allowedDomainsTooltip')} />
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 flex gap-x-2">
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
                      className="mt-1 h-[40px] !px-3 !py-2"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
              {allowedDomains.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {allowedDomains.map(domain => (
                    <span
                      key={domain}
                      className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs"
                    >
                      {domain}
                      <button
                        onClick={() => handleRemoveAllowedDomain(domain)}
                        className="ms-1 text-muted-foreground hover:text-foreground"
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
                    className="inline-flex items-center text-primary hover:text-primary-dark"
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
  );
};
