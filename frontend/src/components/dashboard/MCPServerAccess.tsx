import React, { useState, useEffect, useCallback } from 'react';
import {
  KeyIcon,
  CommandLineIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  ServerIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { apiKeysApi } from '../../services/api/apiKeys';
import { ApiKey } from '../../types/apiKeys';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/env';
import { useSettings } from '../../contexts/SettingsProvider';
import { Link } from 'react-router-dom';
import { ClaudeLogo, CursorLogo, VSCodeLogo, WindsurfLogo } from '../logos';
import { ArrowRight } from '../shared/DirectionalIcon';
import { useTranslation } from 'react-i18next';

export const MCPServerAccess: React.FC = () => {
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'apikeys' | 'mcp' | 'sse'>('apikeys');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [selectedApp, setSelectedApp] = useState<
    'windsurf' | 'cursor' | 'vscode' | 'claude-desktop' | 'claude-code' | 'general'
  >('general');
  const { settings } = useSettings();

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await apiKeysApi.list(1);
      setApiKeys(response.results);
      if (response.results.length > 0) {
        setSelectedApiKey(response.results[0].key);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      toast.success(t('toasts.success.copied'));
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (_error) {
      toast.error(t('dashboard.mcp.copyError'));
    }
  };

  const getBaseUrl = useCallback(() => {
    let url = API_URL;
    if (!/^https?:\/\//i.test(url)) {
      url = window.location.origin;
    }
    return url;
  }, []);

  const getSSEUrl = useCallback(() => {
    let baseMCPUrl;
    if (settings?.mcp_server.startsWith('/')) {
      baseMCPUrl = getBaseUrl() + settings?.mcp_server;
    } else {
      baseMCPUrl = settings?.mcp_server;
    }
    if (!selectedApiKey) return baseMCPUrl + '?apikey=YOUR_API_KEY';
    return baseMCPUrl + '?apikey=' + selectedApiKey;
  }, [settings?.mcp_server, selectedApiKey, getBaseUrl]);

  const applications = [
    { id: 'general', name: 'General', icon: '🔧' },
    { id: 'windsurf', name: 'Windsurf', icon: WindsurfLogo },
    { id: 'cursor', name: 'Cursor', icon: CursorLogo },
    { id: 'vscode', name: 'VS Code', icon: VSCodeLogo },
    { id: 'claude-desktop', name: 'Claude Desktop', icon: ClaudeLogo },
    { id: 'claude-code', name: 'Claude Code', icon: ClaudeLogo },
  ] as const;

  const getMCPConfig = () => {
    const apiKey = selectedApiKey || 'YOUR_API_KEY';
    const baseUrl = getBaseUrl();
    const sseUrl = getSSEUrl();

    switch (selectedApp) {
      case 'vscode':
        return JSON.stringify(
          {
            servers: {
              watercrawl: {
                command: 'npx',
                args: ['@watercrawl/mcp', '--api-key', apiKey, '--base-url', baseUrl],
              },
            },
          },
          null,
          2
        );

      case 'windsurf':
        return JSON.stringify(
          {
            mcpServers: {
              watercrawl: {
                serverUrl: sseUrl,
              },
            },
          },
          null,
          2
        );

      case 'claude-code':
        return `claude mcp add watercrawl -e WATERCRAWL_API_KEY=${apiKey} -- npx -y @watercrawl/mcp --base-url ${baseUrl}`;
      default:
        return JSON.stringify(
          {
            mcpServers: {
              watercrawl: {
                command: 'npx',
                args: ['@watercrawl/mcp', '--api-key', apiKey, '--base-url', baseUrl],
              },
            },
          },
          null,
          2
        );
    }
  };

  const getMCPInstallLink = useCallback(() => {
    switch (selectedApp) {
      case 'cursor':
        return (
          'https://cursor.com/en/install-mcp?name=watercrawl&config=' +
          btoa(
            JSON.stringify({
              command: 'npx',
              args: ['@watercrawl/mcp', '--base-url', getBaseUrl()],
              env: {
                WATERCRAWL_API_KEY: selectedApiKey,
              },
            })
          )
        );

      case 'vscode':
        return `https://insiders.vscode.dev/redirect/mcp/install?name=watercrawl&config={"command":"npx","args":["-y","@watercrawl/mcp", "--base-url", "${getBaseUrl()}"],"env":{"WATERCRAWL_API_KEY":"${selectedApiKey}"}}`;
      default:
        return null;
    }
  }, [selectedApp, selectedApiKey, getBaseUrl]);

  const mcpInstallLink = getMCPInstallLink();

  const getConfigDescription = () => {
    switch (selectedApp) {
      case 'windsurf':
        return (
          <p className="mb-4 text-sm text-muted-foreground">
            {t('dashboard.mcp.windsurfDesc')}{' '}
            <Link
              className="underline"
              to="https://docs.windsurf.com/windsurf/cascade/mcp"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('dashboard.mcp.moreInfo')}
            </Link>
          </p>
        );
      case 'cursor':
        return (
          <p className="mb-4 text-sm text-muted-foreground">
            {t('dashboard.mcp.cursorDesc')}{' '}
            <Link
              className="underline"
              to="https://docs.cursor.com/en/context/mcp"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('dashboard.mcp.moreInfo')}
            </Link>
          </p>
        );
      case 'vscode':
        return (
          <p className="mb-4 text-sm text-muted-foreground">
            {t('dashboard.mcp.vscodeDesc')}{' '}
            <Link
              className="underline"
              to="https://code.visualstudio.com/docs/copilot/customization/mcp-servers"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('dashboard.mcp.moreInfo')}
            </Link>
          </p>
        );
      case 'claude-code':
        return (
          <p className="mb-4 text-sm text-muted-foreground">
            {t('dashboard.mcp.claudeCodeDesc')}{' '}
            <Link
              className="underline"
              to="https://docs.anthropic.com/en/docs/claude-code/mcp"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('dashboard.mcp.moreInfo')}
            </Link>
          </p>
        );
      case 'claude-desktop':
        return (
          <p className="mb-4 text-sm text-muted-foreground">
            {t('dashboard.mcp.claudeDesktopDesc')}{' '}
            <Link
              className="underline"
              to="https://www.anthropic.com/engineering/desktop-extensions"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('dashboard.mcp.moreInfo')}
            </Link>
          </p>
        );
      case 'general':
      default:
        return (
          <p className="mb-4 text-sm text-muted-foreground">
            {t('dashboard.mcp.generalDesc')}{' '}
            <Link
              className="underline"
              to="https://modelcontextprotocol.io/docs/getting-started/intro"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('dashboard.mcp.moreInfo')}
            </Link>
          </p>
        );
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const maskKey = (key: string) => {
    if (key.length <= 9) return key;
    return (
      key.substring(0, 4) + '*'.repeat(Math.max(1, key.length - 9)) + key.substring(key.length - 5)
    );
  };

  const CodeBlock: React.FC<{ code: string; language: string; copyId: string; apiKey: string }> = ({
    code,
    language,
    copyId,
    apiKey,
  }) => (
    <div className="ltr relative rounded-t-lg border border-border">
      <div className="flex items-center justify-between rounded-t-lg bg-card px-4 py-2">
        <span className="text-xs font-medium uppercase text-muted-foreground">{language}</span>
        <button
          onClick={() => copyToClipboard(code, copyId)}
          className="p-1 text-muted-foreground transition-colors hover:text-white"
        >
          {copiedItem === copyId ? (
            <CheckIcon className="h-4 w-4 text-success" />
          ) : (
            <ClipboardDocumentIcon className="h-4 w-4" />
          )}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-b-lg bg-background p-4 text-sm text-muted-foreground">
        <code>{code.replace(apiKey, maskKey(apiKey))}</code>
      </pre>
    </div>
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-x-3">
          <ServerIcon className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">{t('dashboard.mcp.title')}</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-3/4 rounded bg-muted"></div>
          <div className="h-32 rounded bg-muted"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center gap-x-3">
        <SparklesIcon className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('dashboard.mcp.hubTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('dashboard.mcp.hubSubtitle')}</p>
        </div>
      </div>

      {apiKeys.length === 0 ? (
        <div className="rounded-lg border border-warning bg-warning-light py-8 text-center">
          <ExclamationTriangleIcon className="mx-auto mb-3 h-12 w-12 text-warning" />
          <p className="mb-2 text-warning-dark">{t('dashboard.mcp.noKeys')}</p>
          <p className="text-sm text-warning">{t('dashboard.mcp.noKeysMessage')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* API Key Selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t('dashboard.mcp.selectKey')}
            </label>
            <select
              value={selectedApiKey}
              onChange={e => setSelectedApiKey(e.target.value)}
              className="w-full rounded-lg border border-input-border bg-background px-3 py-2 text-foreground focus:border-transparent focus:ring-2 focus:ring-primary"
            >
              {apiKeys.map(key => (
                <option key={key.uuid} value={key.key}>
                  {key.name} (***{key.key.slice(-4)})
                </option>
              ))}
            </select>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-border">
            <nav className="-mb-px flex gap-x-8">
              <button
                onClick={() => setActiveTab('apikeys')}
                className={`border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'apikeys'
                    ? 'border-primary-500 text-primary'
                    : 'border-transparent text-muted-foreground hover:border-input-border hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-x-2">
                  <KeyIcon className="h-4 w-4" />
                  <span>{t('dashboard.mcp.apiKeysTab')}</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('mcp')}
                className={`border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'mcp'
                    ? 'border-primary-500 text-primary'
                    : 'border-transparent text-muted-foreground hover:border-input-border hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-x-2">
                  <CommandLineIcon className="h-4 w-4" />
                  <span>{t('dashboard.mcp.mcpConfigTab')}</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'apikeys' && (
              <div>
                {apiKeys.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-input-border py-12 text-center">
                    <KeyIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h4 className="mb-2 text-lg font-medium text-foreground">
                      {t('dashboard.mcp.noKeysAvailable')}
                    </h4>
                    <p className="mx-auto mb-4 max-w-sm text-muted-foreground">
                      {t('dashboard.mcp.createKeyMessage')}
                    </p>
                    <a
                      href="/dashboard/api-keys"
                      className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                    >
                      {t('dashboard.mcp.goToApiKeys')}
                    </a>
                  </div>
                ) : (
                  <div>
                    {(() => {
                      const selectedKey = apiKeys.find(key => key.key === selectedApiKey);
                      if (!selectedKey) return null;

                      return (
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-foreground">
                            {t('dashboard.mcp.apiKey')}
                          </label>
                          <div className="flex items-center gap-x-3">
                            <div className="relative flex-1">
                              <code className="block w-full rounded-lg border border-border bg-muted px-4 py-3 font-mono text-sm text-foreground">
                                {visibleKeys.has(selectedKey.uuid)
                                  ? selectedKey.key
                                  : maskKey(selectedKey.key)}
                              </code>
                            </div>
                            <div className="flex items-center gap-x-2">
                              <button
                                onClick={() => toggleKeyVisibility(selectedKey.uuid)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-muted-foreground"
                                title={
                                  visibleKeys.has(selectedKey.uuid)
                                    ? t('dashboard.mcp.hideKey')
                                    : t('dashboard.mcp.showKey')
                                }
                              >
                                {visibleKeys.has(selectedKey.uuid) ? (
                                  <EyeSlashIcon className="h-5 w-5" />
                                ) : (
                                  <EyeIcon className="h-5 w-5" />
                                )}
                              </button>
                              <button
                                onClick={() => copyToClipboard(selectedKey.key, selectedKey.uuid)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                title={t('dashboard.mcp.copyKey')}
                              >
                                {copiedItem === selectedKey.uuid ? (
                                  <CheckIcon className="h-5 w-5 text-success" />
                                ) : (
                                  <ClipboardDocumentIcon className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Management Link */}
                    <div className="mt-6 border-t border-border pt-6">
                      <a
                        href="/dashboard/api-keys"
                        className="inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-primary-dark"
                      >
                        <span>{t('dashboard.mcp.manageKeys')}</span>
                        <ArrowRight className="ms-1 h-4 w-4" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'mcp' && (
              <div>
                {/* Application Selector */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {applications.map(app => (
                      <button
                        key={app.id}
                        onClick={() => setSelectedApp(app.id as any)}
                        className={`inline-flex items-center gap-x-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedApp === app.id
                            ? 'border border-primary bg-primary-light text-primary-dark'
                            : 'border border-border bg-primary-light/10 text-foreground hover:bg-primary-light/20'
                        }`}
                      >
                        {typeof app.icon === 'string' ? (
                          <span>{app.icon}</span>
                        ) : (
                          <app.icon size={14} />
                        )}
                        <span>{app.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {getConfigDescription()}

                {selectedApp === 'general' ? (
                  <div className="space-y-4">
                    <div>
                      <CodeBlock
                        code={getMCPConfig()}
                        language="Configuration"
                        copyId={`mcp-config-${selectedApp}-npx`}
                        apiKey={selectedApiKey}
                      />
                    </div>
                    <div>
                      <CodeBlock
                        code={getSSEUrl()}
                        language="SSE URL"
                        copyId={`mcp-config-${selectedApp}-sse`}
                        apiKey={selectedApiKey}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      {mcpInstallLink && (
                        <Link
                          to={mcpInstallLink}
                          className="mb-4 inline-flex items-center justify-center rounded-lg border-2 border-primary bg-background px-6 py-3 font-medium text-primary shadow-sm transition-all duration-200 hover:border-primary hover:bg-primary/10 hover:shadow-md"
                        >
                          <span className="me-2 text-lg">
                            {selectedApp === 'cursor' && <CursorLogo className="h-6 w-6" />}
                            {selectedApp === 'windsurf' && <WindsurfLogo className="h-6 w-6" />}
                            {selectedApp === 'vscode' && <VSCodeLogo className="h-6 w-6" />}
                            {selectedApp === 'claude-code' && <ClaudeLogo className="h-6 w-6" />}
                            {selectedApp === 'claude-desktop' && <ClaudeLogo className="h-6 w-6" />}
                          </span>
                          <span>{t('dashboard.mcp.addMcpTo', { app: selectedApp })}</span>
                        </Link>
                      )}
                    </div>
                    <CodeBlock
                      code={getMCPConfig()}
                      language="Configuration"
                      copyId={`mcp-config-${selectedApp}`}
                      apiKey={selectedApiKey}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
