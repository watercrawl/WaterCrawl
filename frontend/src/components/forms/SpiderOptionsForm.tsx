import React, { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { FormInput, InfoTooltip, OptionGroup } from '../shared/FormComponents';
import { Button } from '../shared/Button';

export interface SpiderOptions {
  maxDepth: string;
  pageLimit: string;
  allowedDomains: string[];
  excludePaths: string[];
  includePaths: string[];
}

interface SpiderOptionsFormProps {
  options: SpiderOptions;
  onChange: (options: Partial<SpiderOptions>) => void;
}

export const SpiderOptionsForm: React.FC<SpiderOptionsFormProps> = ({ options, onChange }) => {
  const [newExcludePath, setNewExcludePath] = useState('');
  const [newIncludePath, setNewIncludePath] = useState('');
  const [newAllowedDomain, setNewAllowedDomain] = useState('');

  const excludePaths = options.excludePaths;
  const includePaths = options.includePaths;
  const allowedDomains = options.allowedDomains;

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Crawler Settings */}
      <div className="space-y-6">
        <OptionGroup
          title="Crawler Settings"
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
                  value={options.maxDepth}
                  onChange={(value) => handleInputChange('maxDepth', value)}
                  placeholder="1"
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
                  value={options.pageLimit}
                  onChange={(value) => handleInputChange('pageLimit', value)}
                  placeholder="1"
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
                      placeholder="eg. example.com"
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
                      placeholder="eg. /login/*, "
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
                      placeholder="eg. /blog/*, *docs*"
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
    </div>
  );
};
