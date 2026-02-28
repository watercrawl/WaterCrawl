import React, { useState, useEffect, useCallback } from 'react';

import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { ClipboardIcon } from '@heroicons/react/24/outline';

import DocumentItem from '../crawl/DocumentItem';

import { apiKeysApi } from '../../services/api/apiKeys';
import { ApiKey } from '../../types/apiKeys';

export interface ApiDocTab {
  name: string;
  contentGenerator: (apiKey: string) => string;
  documentTitle: string;
  documentUrl: string;
  installCommand: string;
  language: string;
}

interface ApiDocumentationProps {
  titleKey: string;
  descriptionKey: string;
  tabs: ApiDocTab[];
  emptyStateDescriptionKey?: string;
  showEmptyState?: boolean;
  showHeader?: boolean;
  showBorder?: boolean;
}

function classNamesHelper(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const copyToClipboard = async (text: string, t: any) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(t('common.copiedToClipboard'));
  } catch (_) {
    toast.error(t('common.copyFailed'));
  }
};

export const ApiDocumentation: React.FC<ApiDocumentationProps> = ({
  titleKey,
  descriptionKey,
  tabs,
  emptyStateDescriptionKey,
  showEmptyState = false,
  showHeader = true,
  showBorder = true,
}) => {
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoadingKeys(true);
      const response = await apiKeysApi.list(1);
      if (response && response.results) {
        setApiKeys(response.results);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoadingKeys(false);
    }
  };

  // Get selected API key value for content generation
  const getCurrentApiKey = useCallback(() => {
    const selectedKey = apiKeys.find(k => k.uuid === selectedApiKey);
    return selectedKey ? selectedKey.key : 'YOUR_API_KEY';
  }, [apiKeys, selectedApiKey]);

  if (showEmptyState) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-medium text-foreground">{t(titleKey)}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {emptyStateDescriptionKey ? t(emptyStateDescriptionKey) : t(descriptionKey)}
        </p>
      </div>
    );
  }

  return (
    <div className={showBorder ? "rounded-lg border border-border bg-card" : ""}>
      {showHeader && (
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-base font-semibold text-foreground">{t(titleKey)}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t(descriptionKey)}</p>
        </div>
      )}
      <div className={showBorder ? "p-6" : ""}>
        <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab}>
          <TabList className="flex gap-x-1 rounded-lg bg-muted p-1">
            {tabs.map(tab => (
              <Tab
                key={tab.name}
                className={({ selected }: { selected: boolean }) =>
                  classNamesHelper(
                    'px-4 py-2.5 text-sm font-medium leading-5 focus:outline-none',
                    selected
                      ? 'border-b-2 border-primary-strong text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                {tab.name}
              </Tab>
            ))}
          </TabList>
          <TabPanels className="mt-6">
            {tabs.map((tab, idx) => (
              <TabPanel key={idx} className="focus:outline-none">
                <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
                    <div className="flex items-center gap-x-2">
                      <div className="flex gap-x-2">
                        <div className="h-3 w-3 rounded-full bg-error"></div>
                        <div className="h-3 w-3 rounded-full bg-warning"></div>
                        <div className="h-3 w-3 rounded-full bg-success"></div>
                      </div>
                      <div className="ms-4 text-xs text-muted-foreground">
                        {tab.name} {t('api.example')}
                      </div>
                    </div>
                    <div className="flex items-center gap-x-2">
                      <select
                        id={`api-key-select-${tab.name}`}
                        className="w-40 rounded-md border-border bg-muted p-1 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        value={selectedApiKey}
                        onChange={e => setSelectedApiKey(e.target.value)}
                        disabled={loadingKeys}
                      >
                        <option value="">{t('api.selectApiKey')}</option>
                        {apiKeys.map(key => (
                          <option key={key.uuid} value={key.uuid}>
                            {key.name} ({key.key.slice(0, 6)}...)
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(tab.contentGenerator(getCurrentApiKey()), t)}
                        className="inline-flex items-center text-xs text-muted-foreground hover:text-muted-foreground focus:outline-none"
                      >
                        <ClipboardIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <DocumentItem
                    content={tab.contentGenerator(getCurrentApiKey())}
                    documentTitle={tab.documentTitle}
                    documentUrl={tab.documentUrl}
                    installCommand={tab.installCommand}
                    language={tab.language}
                  />
                </div>
              </TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
};
