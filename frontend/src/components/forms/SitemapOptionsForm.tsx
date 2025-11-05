import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import ArrayStringField from '../shared/ArrayStringField';
import { FormInput, InfoTooltip, OptionGroup } from '../shared/FormComponents';
import { Switch } from '../shared/Switch';

import { SitemapOptions } from '../../types/sitemap';

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
          <OptionGroup title={t('sitemap.options.generalSettings')} description={t('sitemap.options.generalSettingsDesc')}>
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
      </div>
    </div>
  );
};
