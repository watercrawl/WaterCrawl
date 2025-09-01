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

export const MCPServerAccess: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'apikeys' | 'mcp' | 'sse'>('apikeys');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [selectedApp, setSelectedApp] = useState<'windsurf' | 'cursor' | 'vscode' | 'claude-desktop' | 'claude-code' | 'general'>('general');
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
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (_error) {
      toast.error('Failed to copy to clipboard');
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
        return JSON.stringify({
          "servers": {
            "watercrawl": {
              "command": "npx",
              "args": [
                "@watercrawl/mcp",
                "--api-key",
                apiKey,
                "--base-url",
                baseUrl
              ]
            }
          }
        }, null, 2);

      case 'windsurf':
        return JSON.stringify({
          "mcpServers": {
            "watercrawl": {
              "serverUrl": sseUrl
            }
          }
        }, null, 2);

      case 'claude-code':
        return `claude mcp add watercrawl -e WATERCRAWL_API_KEY=${apiKey} -- npx -y @watercrawl/mcp --base-url ${baseUrl}`;
      default:
        return JSON.stringify({
          "mcpServers": {
            "watercrawl": {
              "command": "npx",
              "args": [
                "@watercrawl/mcp",
                "--api-key",
                apiKey,
                "--base-url",
                baseUrl
              ]
            }
          }
        }, null, 2);
    }
  };

  const getMCPInstallLink = useCallback(() => {
    switch (selectedApp) {
      case 'cursor':
        return 'https://cursor.com/en/install-mcp?name=watercrawl&config=' + btoa(JSON.stringify({
          "command": "npx",
          "args": [
            "@watercrawl/mcp",
            "--base-url",
            getBaseUrl(),
          ],
          "env": {
            "WATERCRAWL_API_KEY": selectedApiKey,
          }
        }));

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
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Add this configuration to your Windsurf mcp_config.json file. <Link className="underline" to="https://docs.windsurf.com/windsurf/cascade/mcp" target="_blank" rel="noopener noreferrer">
              more info
            </Link>
          </p>
        );
      case 'cursor':
        return (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Click this URL to automatically install the MCP server in Cursor. <Link className="underline" to="https://docs.cursor.com/en/context/mcp" target="_blank" rel="noopener noreferrer">
              more info
            </Link>
          </p>
        );
      case 'vscode':
        return (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Click this URL to automatically install the MCP server in VS Code. <Link className="underline" to="https://code.visualstudio.com/docs/copilot/customization/mcp-servers" target="_blank" rel="noopener noreferrer">
              more info
            </Link>
          </p>
        );
      case 'claude-code':
        return (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Run this command in your terminal to install the MCP server. <Link className="underline" to="https://docs.anthropic.com/en/docs/claude-code/mcp" target="_blank" rel="noopener noreferrer">
              more info
            </Link>
          </p>
        );
      case 'claude-desktop':
        return (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Add this configuration to your Claude desktop mcp config file. <Link className="underline" to="https://www.anthropic.com/engineering/desktop-extensions" target="_blank" rel="noopener noreferrer">
              more info
            </Link>
          </p>
        );
      case 'general':
      default:
        return (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Use these configurations for any MCP-compatible application. <Link className="underline" to="https://modelcontextprotocol.io/docs/getting-started/intro" target="_blank" rel="noopener noreferrer">
              more info
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
    return key.substring(0, 4) + '*'.repeat(Math.max(1, key.length - 9)) + key.substring(key.length - 5);
  };


  const CodeBlock: React.FC<{ code: string; language: string; copyId: string, apiKey: string }> = ({ code, language, copyId, apiKey }) => (
    <div className="relative rounded-t-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg">
        <span className="text-xs font-medium text-gray-300 uppercase">{language}</span>
        <button
          onClick={() => copyToClipboard(code, copyId)}
          className="p-1 text-gray-400 hover:text-white transition-colors"
        >
          {copiedItem === copyId ? (
            <CheckIcon className="h-4 w-4 text-green-400" />
          ) : (
            <ClipboardDocumentIcon className="h-4 w-4" />
          )}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto text-sm">
        <code>{code.replace(apiKey, maskKey(apiKey))}</code>
      </pre>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ServerIcon className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">MCP Server Access</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <SparklesIcon className="h-6 w-6 text-primary-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">API & Integration Hub</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage API keys and connect AI assistants</p>
        </div>
      </div>

      {apiKeys.length === 0 ? (
        <div className="text-center py-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <p className="text-yellow-800 dark:text-yellow-200 mb-2">No API keys available</p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            Create an API key first to access MCP server features.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* API Key Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select API Key
            </label>
            <select
              value={selectedApiKey}
              onChange={(e) => setSelectedApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {apiKeys.map((key) => (
                <option key={key.uuid} value={key.key}>
                  {key.name} (***{key.key.slice(-4)})
                </option>
              ))}
            </select>
          </div>


          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('apikeys')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'apikeys'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <KeyIcon className="h-4 w-4" />
                  <span>API Keys</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('mcp')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'mcp'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <CommandLineIcon className="h-4 w-4" />
                  <span>MCP Configuration</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'apikeys' && (
              <div>

                {apiKeys.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <KeyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No API Keys Available</h4>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                      You need to create an API key to access the WaterCrawl API and use MCP integration
                    </p>
                    <a
                      href="/dashboard/api-keys"
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Go to API Keys Management
                    </a>
                  </div>
                ) : (
                  <div>
                    {(() => {
                      const selectedKey = apiKeys.find(key => key.key === selectedApiKey);
                      if (!selectedKey) return null;

                      return (
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            API Key
                          </label>
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 relative">
                              <code className="block w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 font-mono text-gray-900 dark:text-gray-100">
                                {visibleKeys.has(selectedKey.uuid) ? selectedKey.key : maskKey(selectedKey.key)}
                              </code>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleKeyVisibility(selectedKey.uuid)}
                                className="inline-flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title={visibleKeys.has(selectedKey.uuid) ? 'Hide key' : 'Show key'}
                              >
                                {visibleKeys.has(selectedKey.uuid) ? (
                                  <EyeSlashIcon className="h-5 w-5" />
                                ) : (
                                  <EyeIcon className="h-5 w-5" />
                                )}
                              </button>
                              <button
                                onClick={() => copyToClipboard(selectedKey.key, selectedKey.uuid)}
                                className="inline-flex items-center justify-center w-10 h-10 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                title="Copy API key"
                              >
                                {copiedItem === selectedKey.uuid ? (
                                  <CheckIcon className="h-5 w-5 text-green-600" />
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
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <a
                        href="/dashboard/api-keys"
                        className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                      >
                        <span>Manage all API keys</span>
                        <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
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
                    {applications.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => setSelectedApp(app.id as any)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedApp === app.id
                          ? 'bg-primary-100 text-primary-800 border border-primary-200 dark:bg-primary-900/30 dark:text-primary-200 dark:border-primary-700'
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
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
                          className="mb-4 inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-800 border-2 border-primary-300 dark:border-primary-600 rounded-lg text-primary-700 dark:text-primary-300 font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-400 dark:hover:border-primary-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <span className="text-lg mr-2">
                            {selectedApp === 'cursor' && <CursorLogo className="h-6 w-6" />}
                            {selectedApp === 'windsurf' && <WindsurfLogo className="h-6 w-6" />}
                            {selectedApp === 'vscode' && <VSCodeLogo className="h-6 w-6" />}
                            {selectedApp === 'claude-code' && <ClaudeLogo className="h-6 w-6" />}
                            {selectedApp === 'claude-desktop' && <ClaudeLogo className="h-6 w-6" />}
                          </span>
                          <span>Add MCP to {selectedApp}</span>
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
