import React, { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PageOptions } from '../../types/crawl';
import { OptionGroup, FormInput, InfoTooltip } from '../shared/FormComponents';
import { Button } from '../shared/Button';
import { Switch } from '../shared/Switch';

interface PageOptionsFormProps {
  options: PageOptions;
  onChange: (options: Partial<PageOptions>) => void;
}


export const PageOptionsForm: React.FC<PageOptionsFormProps> = ({ options, onChange }) => {
  React.useEffect(() => {
    if (options.ignore_rendering && options.actions && options.actions.length > 0) {
      const actionsToRemove = ['pdf', 'screenshot'];
      const hasActionsToRemove = options.actions.some(action => action && actionsToRemove.includes(action.type));

      if (hasActionsToRemove) {
        const updatedActions = options.actions.filter(action => action && !actionsToRemove.includes(action.type));
        onChange({ actions: updatedActions });
      }
    }
  }, [options.actions, options.ignore_rendering, onChange, options.ignore_rendering]);

  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [newExcludeTag, setNewExcludeTag] = useState('');
  const [newIncludeTag, setNewIncludeTag] = useState('');

  const handleInputChange = (field: keyof PageOptions, value: string | boolean | string[]) => {
    if (field === 'exclude_tags' || field === 'include_tags') {
      onChange({ [field]: value.toString().split(',').map(tag => tag.trim()).filter(Boolean) });
    } else if (field === 'wait_time' || field === 'timeout') {
      const numValue = parseInt(value as string);
      if (!isNaN(numValue)) {
        onChange({ [field]: numValue });
      }
    } else {
      onChange({ [field]: value });
    }
  };

  const handleAddHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      const updatedHeaders = {
        ...options.extra_headers,
        [newHeaderKey]: newHeaderValue
      };
      onChange({ extra_headers: updatedHeaders });
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  const handleRemoveHeader = (key: string) => {
    const { [key]: _, ...remainingHeaders } = options.extra_headers || {};
    onChange({ extra_headers: remainingHeaders });
  };

  const handleAddExcludeTag = () => {
    if (newExcludeTag.trim()) {
      const updatedTags = [...options.exclude_tags, newExcludeTag.trim()];
      onChange({ exclude_tags: updatedTags });
      setNewExcludeTag('');
    }
  };

  const handleRemoveExcludeTag = (tagToRemove: string) => {
    const updatedTags = options.exclude_tags.filter(tag => tag !== tagToRemove);
    onChange({ exclude_tags: updatedTags });
  };

  const handleAddIncludeTag = () => {
    if (newIncludeTag.trim()) {
      const updatedTags = [...options.include_tags, newIncludeTag.trim()];
      onChange({ include_tags: updatedTags });
      setNewIncludeTag('');
    }
  };

  const handleRemoveIncludeTag = (tagToRemove: string) => {
    const updatedTags = options.include_tags.filter(tag => tag !== tagToRemove);
    onChange({ include_tags: updatedTags });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* First Column */}
      <div className="space-y-6">
        <OptionGroup
          title="Content Extraction"
          description="Configure how content should be extracted from web pages"
        >
          <div className="space-y-4">
            <Switch
              label="Extract Main Content"
              description="Automatically detect and extract the main content area of the page, removing navigation, ads, and other irrelevant content"
              checked={options.only_main_content}
              onChange={(checked) => handleInputChange('only_main_content', checked)}
            />
            <Switch
              label="Include HTML"
              description="Include the raw HTML content in addition to the extracted text"
              checked={options.include_html}
              onChange={(checked) => handleInputChange('include_html', checked)}
            />
            <Switch
              label="Include Links"
              description="Extract and include all links found in the content"
              checked={options.include_links}
              onChange={(checked) => handleInputChange('include_links', checked)}
            />
            <Switch
              label="Ignore Rendering"
              description="When enabled, uses faster HTTP requests without JavaScript rendering. Disable for SSR sites."
              checked={options.ignore_rendering || false}
              onChange={(checked) => handleInputChange('ignore_rendering', checked)}
            />
          </div>
        </OptionGroup>

        <OptionGroup
          title="Content Filtering"
          description="Specify which HTML elements to include or exclude"
        >
          <div className="space-y-4">
            <div>
              <div className="flex items-center space-x-1 mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Exclude Elements
                </label>
                <InfoTooltip content="Specify CSS selectors for elements to exclude from the crawl (e.g., script, .ad, #footer)" />
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 flex space-x-2">
                    <FormInput
                      label=""
                      value={newExcludeTag}
                      onChange={setNewExcludeTag}
                      placeholder="CSS selector (e.g., header, footer, .ad, #footer)"
                      className="flex-grow"
                    />
                    <Button
                      type="button"
                      onClick={handleAddExcludeTag}
                      disabled={!newExcludeTag.trim()}
                      variant="outline"
                      size="sm"
                      className="!px-3 !py-2 h-[40px] mt-1"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
              {options.exclude_tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {options.exclude_tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveExcludeTag(tag)}
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
                  Include Elements
                </label>
                <InfoTooltip content="Specify CSS selectors for elements to include in the crawl (e.g., article, .content, #main)" />
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 flex space-x-2">
                    <FormInput
                      label=""
                      value={newIncludeTag}
                      onChange={setNewIncludeTag}
                      placeholder="CSS selector (e.g., article, .content, #main)"
                      className="flex-grow"
                    />
                    <Button
                      type="button"
                      onClick={handleAddIncludeTag}
                      disabled={!newIncludeTag.trim()}
                      variant="outline"
                      size="md"
                      className="!px-3 !py-2 h-[40px] mt-1"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
              {options.include_tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {options.include_tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveIncludeTag(tag)}
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

      {/* Second Column */}
      <div className="space-y-6">
        <OptionGroup
          title="Timing"
          description="Configure waiting and timeout settings"
        >
          <div className="space-y-4">
            <div>
              <div className="flex items-center space-x-1 mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Wait Time
                  {options.ignore_rendering && (
                    <span className="ml-1 text-xs text-red-500 dark:text-gray-400">
                      (not available when ignore rendering is on)
                    </span>
                  )}
                </label>
                <InfoTooltip content="Time to wait in milliseconds for dynamic content to load before extracting content" />
              </div>
              <FormInput
                label=""
                value={options.ignore_rendering ? '' : options.wait_time.toString()}
                onChange={(value) => handleInputChange('wait_time', value)}
                type="number"
                placeholder={options.ignore_rendering ? 'Auto' : '1000'}
                disabled={options.ignore_rendering}
              />
            </div>

            <div>
              <div className="flex items-center space-x-1 mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Timeout
                </label>
                <InfoTooltip content="Maximum time in milliseconds to wait before timing out the request" />
              </div>
              <FormInput
                label=""
                value={options.timeout?.toString() || ''}
                onChange={(value) => handleInputChange('timeout', value)}
                type="number"
                placeholder="30000"
              />
            </div>
          </div>
        </OptionGroup>

        <OptionGroup
          title={
            <div className="flex items-center space-x-1">
              <span>Actions</span>
              {options.ignore_rendering && (
                <span className="text-xs text-red-500 dark:text-gray-400">
                  (not available when ignore rendering is on)
                </span>
              )}
            </div>
          }
          description="Additional actions to perform on each page"
        >
          <div className="space-y-4">
            <Switch
              label="Generate PDF"
              description="Save the page as a PDF file for offline viewing or archiving"
              checked={options.actions?.some(action => action.type === 'pdf') ?? false}
              onChange={(checked) => {
                const currentActions = options.actions || [];
                if (checked) {
                  if (!currentActions.some(action => action.type === 'pdf')) {
                    onChange({ actions: [...currentActions, { type: 'pdf' }] });
                  }
                } else {
                  onChange({
                    actions: currentActions.filter(action => action.type !== 'pdf')
                  });
                }
              }}
              disabled={options.ignore_rendering}
            />
            <Switch
              label="Take Screenshot"
              description="Capture a screenshot of the page for visual reference"
              checked={options.actions?.some(action => action.type === 'screenshot') ?? false}
              onChange={(checked) => {
                const currentActions = options.actions || [];
                if (checked) {
                  if (!currentActions.some(action => action.type === 'screenshot')) {
                    onChange({ actions: [...currentActions, { type: 'screenshot' }] });
                  }
                } else {
                  onChange({
                    actions: currentActions.filter(action => action.type !== 'screenshot')
                  });
                }
              }}
              disabled={options.ignore_rendering}
            />
          </div>
        </OptionGroup>
      </div>

      {/* Third Column */}
      <div className="space-y-6">
        <OptionGroup
          title="Cookie and Locale Settings"
          description="Configure cookie acceptance and locale preferences"
        >
          <div className="space-y-4">
            <div>
              <div className="flex items-center space-x-1 mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Accept Cookies Selector
                  {options.ignore_rendering && (
                    <span className="ml-1 text-xs text-red-500 dark:text-gray-400">
                      (not available when ignore rendering is on)
                    </span>
                  )}
                </label>
                <InfoTooltip content="CSS selector for the accept cookies button (e.g., #accept-cookies-btn, .cookie-accept)" />
              </div>
              <FormInput
                label=""
                value={options.ignore_rendering ? '' : options.accept_cookies_selector || ''}
                onChange={(value) => handleInputChange('accept_cookies_selector', value)}
                placeholder={options.ignore_rendering ? "-" : "#accept-cookies-btn"}
                disabled={options.ignore_rendering}
              />
            </div>

            <div>
              <div className="flex items-center space-x-1 mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Locale
                </label>
                <InfoTooltip content="Set the preferred language for the page (e.g., en-US, fr-FR, de-DE)" />
              </div>
              <FormInput
                label=""
                value={options.locale || ''}
                onChange={(value) => handleInputChange('locale', value)}
                placeholder="en-US"
              />
            </div>
          </div>
        </OptionGroup>

        <OptionGroup
          title="Custom Headers"
          description="Add custom HTTP headers to be sent with requests"
        >
          <div className="space-y-4">
            {/* Existing Headers */}
            {Object.entries(options.extra_headers || {}).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-md">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{key}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{value}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveHeader(key)}
                  className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}

            {/* Add New Header */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center space-x-1 mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Header Name
                    </label>
                    <InfoTooltip content="Name of the HTTP header (e.g., Authorization, X-Custom-Header, X-API-Key)" />
                  </div>
                  <FormInput
                    label=""
                    value={newHeaderKey}
                    onChange={setNewHeaderKey}
                    placeholder="Header Name"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-1 mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Header Value
                    </label>
                  </div>
                  <FormInput
                    label=""
                    value={newHeaderValue}
                    onChange={setNewHeaderValue}
                    placeholder="Header Value"
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={handleAddHeader}
                disabled={!newHeaderKey || !newHeaderValue}
                variant="outline"
                size="md"
                className="!px-3 !py-2 w-full"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Header
              </Button>
            </div>
          </div>
        </OptionGroup>
      </div>
    </div>
  );
};
