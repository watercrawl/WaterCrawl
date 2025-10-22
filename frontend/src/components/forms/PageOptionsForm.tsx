import React, { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { PageOptions } from '../../types/crawl';
import { OptionGroup, FormInput, InfoTooltip } from '../shared/FormComponents';
import { Button } from '../shared/Button';
import { Switch } from '../shared/Switch';
import { useTranslation } from 'react-i18next';

interface PageOptionsFormProps {
  options: PageOptions;
  onChange: (options: Partial<PageOptions>) => void;
}

export const PageOptionsForm: React.FC<PageOptionsFormProps> = ({ options, onChange }) => {
  const { t } = useTranslation();
  React.useEffect(() => {
    if (options.ignore_rendering && options.actions && options.actions.length > 0) {
      const actionsToRemove = ['pdf', 'screenshot'];
      const hasActionsToRemove = options.actions.some(
        action => action && actionsToRemove.includes(action.type)
      );

      if (hasActionsToRemove) {
        const updatedActions = options.actions.filter(
          action => action && !actionsToRemove.includes(action.type)
        );
        onChange({ actions: updatedActions });
      }
    }
  }, [options.actions, options.ignore_rendering, onChange]);

  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [newExcludeTag, setNewExcludeTag] = useState('');
  const [newIncludeTag, setNewIncludeTag] = useState('');

  const handleInputChange = (field: keyof PageOptions, value: string | boolean | string[]) => {
    if (field === 'exclude_tags' || field === 'include_tags') {
      onChange({
        [field]: value
          .toString()
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean),
      });
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
        [newHeaderKey]: newHeaderValue,
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
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {/* First Column */}
      <div className="space-y-3">
        <OptionGroup
          title={t('crawl.pageOptions.contentExtraction')}
          description={t('crawl.pageOptions.contentExtractionDesc')}
        >
          <div className="space-y-3 pb-2">
            <Switch
              label={t('crawl.pageOptions.extractMain')}
              description={t('crawl.pageOptions.extractMainDesc')}
              checked={options.only_main_content}
              onChange={checked => handleInputChange('only_main_content', checked)}
            />
            <Switch
              label={t('crawl.pageOptions.includeHtml')}
              description={t('crawl.pageOptions.includeHtmlDesc')}
              checked={options.include_html}
              onChange={checked => handleInputChange('include_html', checked)}
            />
            <Switch
              label={t('crawl.pageOptions.includeLinks')}
              description={t('crawl.pageOptions.includeLinksDesc')}
              checked={options.include_links}
              onChange={checked => handleInputChange('include_links', checked)}
            />
            <Switch
              label={t('crawl.pageOptions.ignoreRendering')}
              description={t('crawl.pageOptions.ignoreRenderingDesc')}
              checked={options.ignore_rendering || false}
              onChange={checked => handleInputChange('ignore_rendering', checked)}
            />
          </div>
        </OptionGroup>

        <OptionGroup
          title={t('crawl.pageOptions.contentFiltering')}
          description={t('crawl.pageOptions.contentFilteringDesc')}
        >
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center gap-x-1">
                <label className="block text-sm font-medium text-foreground">
                  {t('crawl.pageOptions.excludeElements')}
                </label>
                <InfoTooltip content={t('crawl.pageOptions.excludeElementsTooltip')} />
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 flex gap-x-2">
                    <FormInput
                      label=""
                      value={newExcludeTag}
                      onChange={setNewExcludeTag}
                      placeholder={t('crawl.pageOptions.excludePlaceholder')}
                      className="flex-grow"
                    />
                    <Button
                      type="button"
                      onClick={handleAddExcludeTag}
                      disabled={!newExcludeTag.trim()}
                      variant="outline"
                      size="sm"
                      className="mt-1 h-[40px] !px-3 !py-2"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
              {options.exclude_tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {options.exclude_tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveExcludeTag(tag)}
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
                  {t('crawl.pageOptions.includeElements')}
                </label>
                <InfoTooltip content={t('crawl.pageOptions.includeElementsTooltip')} />
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 flex gap-x-2">
                    <FormInput
                      label=""
                      value={newIncludeTag}
                      onChange={setNewIncludeTag}
                      placeholder={t('crawl.pageOptions.includePlaceholder')}
                      className="flex-grow"
                    />
                    <Button
                      type="button"
                      onClick={handleAddIncludeTag}
                      disabled={!newIncludeTag.trim()}
                      variant="outline"
                      size="md"
                      className="mt-1 h-[40px] !px-3 !py-2"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
              {options.include_tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {options.include_tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveIncludeTag(tag)}
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
      </div>

      {/* Second Column */}
      <div className="space-y-3">
        <OptionGroup
          title={t('crawl.pageOptions.timing')}
          description={t('crawl.pageOptions.timingDesc')}
        >
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center gap-x-1">
                <label className="block text-sm font-medium text-foreground">
                  {t('crawl.pageOptions.waitTime')}
                  {options.ignore_rendering && (
                    <span className="ms-1 text-xs text-error">
                      ({t('crawl.pageOptions.notAvailableWhenIgnoreRendering')})
                    </span>
                  )}
                </label>
                <InfoTooltip content={t('crawl.pageOptions.waitTimeTooltip')} />
              </div>
              <FormInput
                label=""
                value={options.ignore_rendering ? '' : options.wait_time.toString()}
                onChange={value => handleInputChange('wait_time', value)}
                type="number"
                placeholder={options.ignore_rendering ? 'Auto' : '1000'}
                disabled={options.ignore_rendering}
              />
            </div>

            <div>
              <div className="mb-1 flex items-center gap-x-1">
                <label className="block text-sm font-medium text-foreground">
                  {t('crawl.pageOptions.timeout')}
                </label>
                <InfoTooltip content={t('crawl.pageOptions.timeoutTooltip')} />
              </div>
              <FormInput
                label=""
                value={options.timeout?.toString() || ''}
                onChange={value => handleInputChange('timeout', value)}
                type="number"
                placeholder="30000"
              />
            </div>
          </div>
        </OptionGroup>

        <OptionGroup
          title={
            <div className="flex items-center gap-x-1">
              <span>{t('crawl.pageOptions.actions')}</span>
              {options.ignore_rendering && (
                <span className="text-xs text-error">
                  ({t('crawl.pageOptions.notAvailableWhenIgnoreRendering')})
                </span>
              )}
            </div>
          }
          description={t('crawl.pageOptions.actionsDesc')}
        >
          <div className="space-y-3">
            <Switch
              label={t('crawl.pageOptions.generatePdf')}
              description={t('crawl.pageOptions.generatePdfDesc')}
              checked={options.actions?.some(action => action.type === 'pdf') ?? false}
              onChange={checked => {
                const currentActions = options.actions || [];
                if (checked) {
                  if (!currentActions.some(action => action.type === 'pdf')) {
                    onChange({ actions: [...currentActions, { type: 'pdf' }] });
                  }
                } else {
                  onChange({
                    actions: currentActions.filter(action => action.type !== 'pdf'),
                  });
                }
              }}
              disabled={options.ignore_rendering}
            />
            <Switch
              label={t('crawl.pageOptions.takeScreenshot')}
              description={t('crawl.pageOptions.takeScreenshotDesc')}
              checked={options.actions?.some(action => action.type === 'screenshot') ?? false}
              onChange={checked => {
                const currentActions = options.actions || [];
                if (checked) {
                  if (!currentActions.some(action => action.type === 'screenshot')) {
                    onChange({ actions: [...currentActions, { type: 'screenshot' }] });
                  }
                } else {
                  onChange({
                    actions: currentActions.filter(action => action.type !== 'screenshot'),
                  });
                }
              }}
              disabled={options.ignore_rendering}
            />
          </div>
        </OptionGroup>
      </div>

      {/* Third Column */}
      <div className="space-y-3">
        <OptionGroup
          title={t('crawl.pageOptions.cookieLocale')}
          description={t('crawl.pageOptions.cookieLocaleDesc')}
        >
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center gap-x-1">
                <label className="block text-sm font-medium text-foreground">
                  {t('crawl.pageOptions.acceptCookies')}
                  {options.ignore_rendering && (
                    <span className="ms-1 text-xs text-error">
                      ({t('crawl.pageOptions.notAvailableWhenIgnoreRendering')})
                    </span>
                  )}
                </label>
                <InfoTooltip content={t('crawl.pageOptions.acceptCookiesTooltip')} />
              </div>
              <FormInput
                label=""
                value={options.ignore_rendering ? '' : options.accept_cookies_selector || ''}
                onChange={value => handleInputChange('accept_cookies_selector', value)}
                placeholder={options.ignore_rendering ? '-' : '#accept-cookies-btn'}
                disabled={options.ignore_rendering}
              />
            </div>

            <div>
              <div className="mb-1 flex items-center gap-x-1">
                <label className="block text-sm font-medium text-foreground">
                  {t('crawl.pageOptions.locale')}
                </label>
                <InfoTooltip content={t('crawl.pageOptions.localeTooltip')} />
              </div>
              <FormInput
                label=""
                value={options.locale || ''}
                onChange={value => handleInputChange('locale', value)}
                placeholder="en-US"
              />
            </div>
          </div>
        </OptionGroup>

        <OptionGroup
          title={t('crawl.pageOptions.customHeaders')}
          description={t('crawl.pageOptions.customHeadersDesc')}
        >
          <div className="space-y-3">
            {/* Existing Headers */}
            {Object.entries(options.extra_headers || {}).map(([key, value]) => (
              <div key={key} className="flex items-center gap-x-2 rounded-md bg-muted p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{key}</p>
                  <p className="truncate text-sm text-muted-foreground">{value}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveHeader(key)}
                  className="p-1 text-muted-foreground hover:text-muted-foreground"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}

            {/* Add New Header */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="mb-1 flex items-center gap-x-1">
                    <label className="block text-sm font-medium text-foreground">
                      {t('crawl.pageOptions.headerName')}
                    </label>
                    <InfoTooltip content={t('crawl.pageOptions.headerNameTooltip')} />
                  </div>
                  <FormInput
                    label=""
                    value={newHeaderKey}
                    onChange={setNewHeaderKey}
                    placeholder={t('crawl.pageOptions.headerName')}
                  />
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-x-1">
                    <label className="block text-sm font-medium text-foreground">
                      {t('crawl.pageOptions.headerValue')}
                    </label>
                  </div>
                  <FormInput
                    label=""
                    value={newHeaderValue}
                    onChange={setNewHeaderValue}
                    placeholder={t('crawl.pageOptions.headerValue')}
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={handleAddHeader}
                disabled={!newHeaderKey || !newHeaderValue}
                variant="outline"
                size="md"
                className="w-full !px-3 !py-2"
              >
                <PlusIcon className="me-2 h-4 w-4" />
                {t('crawl.pageOptions.addHeader')}
              </Button>
            </div>
          </div>
        </OptionGroup>
      </div>
    </div>
  );
};
