import React, { useEffect, useState, useCallback } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import {
  CheckIcon,
  DocumentTextIcon,
  LinkIcon,
  GlobeAltIcon,
  FolderArrowDownIcon,
} from '@heroicons/react/24/outline';
import { AxiosError } from 'axios';

import { ChevronRight } from '../../../components/shared/DirectionalIcon';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import { sitemapApi } from '../../../services/api/sitemap';
import { SitemapGraph, SitemapNode } from '../../../types/crawl';
import { KnowledgeBaseDetail } from '../../../types/knowledge';
import { SitemapRequest } from '../../../types/sitemap';



const UrlSelectorPage: React.FC = () => {
  const { t } = useTranslation();
  const { knowledgeBaseId, sitemapRequestId } = useParams<{
    knowledgeBaseId: string;
    sitemapRequestId: string;
  }>();
  const navigate = useNavigate();
  const { setItems } = useBreadcrumbs();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDetail | null>(null);
  const [sitemapData, setSitemapData] = useState<SitemapGraph | null>(null);
  const [isLoadingSitemap, setIsLoadingSitemap] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [sitemapRequest, setSitemapRequest] = useState<SitemapRequest | null>(null);

  useEffect(() => {
    if (!knowledgeBaseId) {
      navigate('/dashboard/knowledge-base');
    }
    knowledgeBaseApi
      .get(knowledgeBaseId as string)
      .then(response => {
        setKnowledgeBase(response);
      })
      .catch(() => {
        toast.error(t('settings.knowledgeBase.toast.loadError'));
        navigate('/dashboard/knowledge-base');
      });
  }, [knowledgeBaseId, navigate, t]);

  useEffect(() => {
    if (!knowledgeBase) return;
    setItems([
      { label: t('dashboard.navigation.dashboard'), href: '/dashboard' },
      { label: t('knowledgeBase.list'), href: '/dashboard/knowledge-base' },
      { label: knowledgeBase.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}` },
      {
        label: t('knowledgeBase.import.title'),
        href: `/dashboard/knowledge-base/${knowledgeBaseId}/import`,
      },
      {
        label: t('knowledgeBase.import.selectSitemap'),
        href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-sitemap`,
      },
      {
        label: t('knowledgeBase.import.selectUrls'),
        href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-urls`,
        current: true,
      },
    ]);
  }, [knowledgeBase, knowledgeBaseId, setItems, t]);

  // Load crawl request data
  useEffect(() => {
    const fetchCrawlData = async () => {
      try {
        if (sitemapRequestId) {
          const sitemapData = await sitemapApi.get(sitemapRequestId);
          setSitemapRequest(sitemapData);
        }
      } catch (error) {
        console.error('Failed to load crawl data:', error);
        toast.error(t('activityLogs.errors.fetchFailed'));
      }
    };

    fetchCrawlData();
  }, [sitemapRequestId, t]);

  // Load sitemap data
  const loadSitemap = useCallback(async () => {
    try {
      setIsLoadingSitemap(true);
      const data = await sitemapApi.getGraph(sitemapRequestId || '');
      console.log('Sitemap data received:', data);
      setSitemapData(data);

      // Auto-expand all domains
      if (data) {
        const roots = new Set<string>();
        // Add all top-level domains to expanded paths
        Object.keys(data).forEach(key => {
          if (key !== '__self__' && key !== '__query__') {
            roots.add(key);
            // Also expand blog section automatically if it exists
            if (data[key] && typeof data[key] === 'object' && 'blog' in data[key]) {
              roots.add(`${key}/blog`);
            }
          }
        });
        console.log('Auto-expanded paths:', Array.from(roots));
        setExpandedPaths(roots);
      }
    } catch (error) {
      console.error('Failed to load sitemap:', error);
      toast.error(t('sitemap.errors.loadFailed'));
      setSitemapData(null);
    } finally {
      setIsLoadingSitemap(false);
    }
  }, [sitemapRequestId, t]);

  // Load sitemap when component mounts
  useEffect(() => {
    loadSitemap();
  }, [loadSitemap]);

  const togglePath = (path: string) => {
    setExpandedPaths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const toggleUrl = (url: string) => {
    setSelectedUrls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(url)) {
        newSet.delete(url);
      } else {
        newSet.add(url);
      }
      return newSet;
    });
  };

  // Select all URLs in a subtree
  const selectSubtree = (node: SitemapGraph | SitemapNode, select: boolean = true) => {
    const allUrls = new Set<string>();
    getAllUrls(node, allUrls);

    setSelectedUrls(prev => {
      const newSet = new Set(prev);

      allUrls.forEach(url => {
        if (select) {
          newSet.add(url);
        } else {
          newSet.delete(url);
        }
      });

      return newSet;
    });
  };

  // Recursive function to collect all URLs from the sitemap
  const getAllUrls = (
    node: SitemapGraph | SitemapNode | undefined,
    allUrls: Set<string> = new Set()
  ) => {
    if (!node) return allUrls;
    if (typeof node === 'object' && node !== null) {
      // Check if this is a SitemapNode with a URL
      if ('url' in node && typeof node.url === 'string') {
        allUrls.add(node.url);
      }

      // Iterate through children if this is a SitemapGraph
      if (!('url' in node)) {
        for (const key in node) {
          if (key !== '__self__' && key !== '__query__') {
            const child = node[key];
            // Handle different possible types of children
            if (Array.isArray(child)) {
              // If it's an array, process each item
              child.forEach(item => {
                if (item && typeof item === 'object') {
                  getAllUrls(item as SitemapNode, allUrls);
                }
              });
            } else if (child && typeof child === 'object') {
              // If it's an object, process it as a SitemapGraph or SitemapNode
              getAllUrls(child as SitemapGraph | SitemapNode, allUrls);
            }
          }
        }
      }

      // Check __self__ node
      if ('__self__' in node && node.__self__ && typeof node.__self__ === 'object') {
        if ('url' in node.__self__ && typeof node.__self__.url === 'string') {
          allUrls.add(node.__self__.url);
        }
      }

      // Check __query__ nodes
      if ('__query__' in node && node.__query__) {
        // Ensure node.__query__ is an array
        const queryNodes = Array.isArray(node.__query__) ? node.__query__ : [node.__query__];
        queryNodes.forEach(queryNode => {
          if (
            queryNode &&
            typeof queryNode === 'object' &&
            'url' in queryNode &&
            typeof queryNode.url === 'string'
          ) {
            allUrls.add(queryNode.url);
          }
        });
      }
    }

    return allUrls;
  };

  const handleSelectAll = () => {
    if (!sitemapData) return;
    // Get all URLs and convert to a Set for selected URLs
    const urls = getAllUrls(sitemapData);
    setSelectedUrls(urls);
  };

  const handleDeselectAll = () => {
    setSelectedUrls(new Set());
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selectedUrls.size === 0) {
      toast.error(t('knowledgeBase.import.pleaseSelectUrl'));
      return;
    }

    if (!knowledgeBaseId) {
      toast.error(t('knowledgeBase.import.missingIds'));
      return;
    }

    setIsSubmitting(true);
    const urlsToImport = Array.from(selectedUrls);

    try {
      await knowledgeBaseApi.importFromUrls(knowledgeBaseId, {
        urls: urlsToImport,
      });
      toast.success(t('knowledgeBase.import.importUrlsSuccess', { count: selectedUrls.size }));
      console.log('Importing URLs:', urlsToImport);

      // Navigate back to knowledge base detail page
      navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error?.response?.data?.message);
      } else {
        console.error('Failed to import URLs:', error);
        toast.error(t('knowledgeBase.import.importUrlsFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render a URL node with checkbox
  const renderUrlNode = (url: string | undefined, title: string | undefined, level: number) => {
    if (!url) return null;

    return (
      <div className="flex items-center py-1" style={{ marginInlineStart: `${level * 1.5}rem` }}>
        <input
          type="checkbox"
          id={`url-${url}`}
          checked={selectedUrls.has(url)}
          onChange={() => toggleUrl(url)}
          className="me-2 h-4 w-4 rounded border-input-border text-primary focus:ring-primary"
        />
        <div className="flex items-center">
          <GlobeAltIcon className="me-1.5 h-5 w-5 text-primary" />
          <span className="line-clamp-1 text-sm font-medium text-foreground" title={title || url}>
            {title || url}
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="ms-2 text-muted-foreground hover:text-primary"
            title={url}
            onClick={e => e.stopPropagation()}
          >
            <LinkIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  };

  // Recursive function to render the sitemap tree with checkboxes
  const renderSitemapTree = (
    data: SitemapGraph | SitemapNode | undefined,
    path: string = '',
    level: number = 0
  ) => {
    if (!data || typeof data !== 'object') {
      return null;
    }

    // If this is a SitemapNode (has URL), render it directly
    if ('url' in data) {
      return renderUrlNode(data.url as string, data.title as string | undefined, level);
    }

    // Handle SitemapGraph (object with potential children)
    const filteredEntries = Object.entries(data as Record<string, any>).filter(
      ([key]) => key !== '__self__' && key !== '__query__'
    );

    // Sort entries to show folders first, then links
    filteredEntries.sort((a, b) => {
      const [, valueA] = a;
      const [, valueB] = b;

      // Check if item A is a folder (has child items)
      const isAFolder =
        valueA &&
        typeof valueA === 'object' &&
        Object.keys(valueA).filter(k => k !== '__self__' && k !== '__query__').length > 0;

      // Check if item B is a folder (has child items)
      const isBFolder =
        valueB &&
        typeof valueB === 'object' &&
        Object.keys(valueB).filter(k => k !== '__self__' && k !== '__query__').length > 0;

      // If one is a folder and the other isn't, folder comes first
      if (isAFolder && !isBFolder) return -1;
      if (!isAFolder && isBFolder) return 1;

      // If both are the same type, sort alphabetically
      return a[0].localeCompare(b[0]);
    });

    // Prepare components array to collect all rendered elements
    const components: JSX.Element[] = [];

    // Process each entry using a for loop instead of map
    for (const [key, value] of filteredEntries) {
      // Build the path string for this node
      const currentPath = path ? `${path}/${key}` : key;
      const isExpanded = expandedPaths.has(currentPath);

      // Check if this node has children (excluding special properties)
      const hasChildren =
        value &&
        typeof value === 'object' &&
        Object.keys(value || {}).filter(k => k !== '__self__' && k !== '__query__').length > 0;

      // Get the self node which contains URL and title
      const selfNode =
        value && typeof value === 'object' && '__self__' in value
          ? (value.__self__ as SitemapNode)
          : null;

      // Check if this node has query parameters
      const hasQueries =
        value &&
        typeof value === 'object' &&
        '__query__' in value &&
        Array.isArray(value.__query__) &&
        value.__query__.length > 0;

      // Determine if we should render children
      const shouldRenderChildren = hasChildren && isExpanded;

      // Create a div for this node
      components.push(
        <div key={currentPath} className="border-b border-border py-1 last:border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Checkbox with proper spacing */}
              {selfNode && selfNode.url && (
                <input
                  type="checkbox"
                  id={`url-${selfNode.url}`}
                  checked={selectedUrls.has(selfNode.url)}
                  onChange={() => toggleUrl(selfNode.url)}
                  className="me-1 h-4 w-4 rounded border-input-border text-primary focus:ring-primary"
                  onClick={e => e.stopPropagation()}
                  style={{ marginInlineStart: `${level * 1.5 + 0.5}rem` }}
                />
              )}

              <div
                className="flex cursor-pointer items-center py-1.5 hover:bg-muted"
                onClick={() => hasChildren && togglePath(currentPath)}
                style={{ marginInlineStart: selfNode ? '0.25rem' : `${level * 1.5 + 0.5}rem` }}
              >
                {hasChildren ? (
                  <ChevronRight
                    className={`me-1 h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90 transform' : ''}`}
                  />
                ) : (
                  <span className="w-5"></span>
                )}
                {hasChildren ? (
                  <FolderArrowDownIcon className="me-1.5 h-5 w-5 text-muted-foreground" />
                ) : (
                  <DocumentTextIcon className="me-1.5 h-5 w-5 text-muted-foreground" />
                )}
                <span className="font-medium text-foreground">{key}</span>

                {/* Show URL icon if this node has a self URL */}
                {selfNode && selfNode.url && (
                  <a
                    href={selfNode.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ms-2 text-muted-foreground hover:text-primary"
                    title={`${selfNode.title || key} - ${selfNode.url}`}
                    onClick={e => e.stopPropagation()}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </a>
                )}

                {hasChildren && (
                  <span className="ms-2 text-xs text-muted-foreground">
                    ({Object.keys(value).filter(k => k !== '__self__' && k !== '__query__').length})
                  </span>
                )}
              </div>
            </div>

            {/* Select/Deselect buttons for subtree */}
            {hasChildren && (
              <div className="me-4 flex gap-x-2">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    selectSubtree(value as SitemapGraph, true);
                  }}
                  className="text-xs text-primary hover:text-primary-strong"
                >
                  {t('knowledgeBase.import.selectTree')}
                </button>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    selectSubtree(value as SitemapGraph, false);
                  }}
                  className="text-xs text-error hover:text-error"
                >
                  {t('knowledgeBase.import.deselectTree')}
                </button>
              </div>
            )}
          </div>

          {isExpanded && (
            <>
              {/* Render query parameters with checkboxes if this node is expanded */}
              {hasQueries &&
                Array.isArray(value.__query__) &&
                value.__query__.map((queryNode: SitemapNode, index: number) => (
                  <div key={`${currentPath}-query-${index}`} className="ms-8">
                    {renderUrlNode(
                      queryNode.url as string,
                      queryNode.title as string | undefined,
                      level + 1
                    )}
                  </div>
                ))}

              {/* Render children recursively */}
              {shouldRenderChildren && (
                <div className="ms-4">
                  {renderSitemapTree(value as SitemapGraph | SitemapNode, currentPath, level + 1)}
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    // Handle root-level query parameters if they exist
    if ('__query__' in data && Array.isArray(data.__query__) && data.__query__?.length > 0) {
      data.__query__.forEach((queryNode, index) => {
        components.push(
          <div key={`${path}-root-query-${index}`} className="ms-8">
            {renderUrlNode(
              queryNode.url as string,
              queryNode.title as string | undefined,
              level + 1
            )}
          </div>
        );
      });
    }

    return <>{components}</>;
  };

  if (isLoadingSitemap) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/4 rounded bg-muted"></div>
          <div className="mb-8 h-4 w-1/2 rounded bg-muted"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded bg-muted"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {t('knowledgeBase.import.selectUrlsTitle')}
            </h1>
            <p className="mt-2 text-sm text-foreground">
              {t('knowledgeBase.import.selectUrlsDescription', { url: sitemapRequest?.url })}
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedUrls.size === 0 || isSubmitting}
              className="inline-flex items-center rounded-md border border-transparent bg-primary px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="me-2 h-4 w-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t('common.importing')}
                </>
              ) : (
                <>
                  <CheckIcon className="me-2 h-4 w-4" />
                  {selectedUrls.size === 0
                    ? t('knowledgeBase.import.selectUrlsToContinue')
                    : t('knowledgeBase.import.importUrls', { count: selectedUrls.size })}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sitemap tree */}
      <div className="overflow-hidden rounded-lg bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border bg-muted p-4">
          <h2 className="text-lg font-medium text-foreground">
            {t('knowledgeBase.import.websiteStructure')}
          </h2>
          <div className="flex gap-x-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-medium text-primary hover:text-primary-strong"
            >
              {t('common.selectAll')}
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="ms-2 text-xs font-medium text-error hover:text-error"
            >
              {t('common.deselectAll')}
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Selected URL counter */}
          <div className="mb-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{selectedUrls.size}</span>{' '}
            {t('knowledgeBase.import.urlsSelected')}
          </div>

          {!sitemapData ? (
            <div className="py-8 text-center text-muted-foreground">{t('sitemap.noData')}</div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto rounded-lg border border-border text-sm">
              {renderSitemapTree(sitemapData)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UrlSelectorPage;
