import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormInput, InfoTooltip, OptionGroup } from '../shared/FormComponents';
import { SitemapOptions } from '../../types/sitemap';
import ArrayStringField from '../shared/ArrayStringField';
import { Switch } from '../shared/Switch';

interface SitemapOptionsFormProps {
  options: SitemapOptions;
  onChange: (options: Partial<SitemapOptions>) => void;
}

export const SitemapOptionsForm: React.FC<SitemapOptionsFormProps> = ({ options, onChange }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState(options.search || '');

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

  return (
    <div>
      {/* Two column section */}
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {/* Left Column - Basic Settings */}
        <div>
          <OptionGroup title={t('dashboard.settings.general')} description={t('sitemap.subtitle')}>
            <div className="space-y-4">
              <div className="flex items-center">
                <Switch
                  label={t('crawl.spiderOptions.allowedDomains')}
                  description={t('crawl.spiderOptions.allowedDomainsTooltip')}
                  checked={includeSubdomains}
                  onChange={checked => handleToggleChange('include_subdomains', checked)}
                />
              </div>

              <div className="flex items-center">
                <Switch
                  label={t('dashboard.settings.advanced')}
                  description={t('sitemap.subtitle')}
                  checked={ignoreSitemapXml}
                  onChange={checked => handleToggleChange('ignore_sitemap_xml', checked)}
                />
              </div>

              {/* Search filter */}
              <div className="space-y-2">
                <div className="mb-1 flex items-center gap-x-1">
                  <label className="block text-sm font-medium text-foreground">
                    {t('search.form.query')}
                  </label>
                  <InfoTooltip content={t('search.form.filters')} />
                </div>
                <FormInput
                  label=""
                  value={searchTerm || ''}
                  onChange={handleSearchChange}
                  type="text"
                  placeholder={t('search.form.queryPlaceholder')}
                />
              </div>
            </div>
          </OptionGroup>
        </div>

        {/* Right Column - Path Settings */}
        <div>
          <OptionGroup
            title={t('crawl.spiderOptions.pathFilters')}
            description={t('crawl.spiderOptions.pathFiltersDesc')}
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
      </div>
    </div>
  );
};
