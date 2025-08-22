import React, { useState } from 'react';
import { FormInput, InfoTooltip, OptionGroup } from '../shared/FormComponents';
import { SitemapOptions } from '../../types/sitemap';
import ArrayStringField from '../shared/ArrayStringField';
import { Switch } from '../shared/Switch';

interface SitemapOptionsFormProps {
  options: SitemapOptions;
  onChange: (options: Partial<SitemapOptions>) => void;
}

export const SitemapOptionsForm: React.FC<SitemapOptionsFormProps> = ({ options, onChange }) => {
  const [searchTerm, setSearchTerm] = useState(options.search || '');

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
    </div>
  );
};
