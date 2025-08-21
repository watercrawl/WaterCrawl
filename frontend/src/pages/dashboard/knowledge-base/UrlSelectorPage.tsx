import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  CheckIcon, 
  DocumentTextIcon,
  LinkIcon,
  GlobeAltIcon,
  ChevronRightIcon,
  FolderArrowDownIcon
} from '@heroicons/react/24/outline';
// Navigation components
import { SitemapGraph, SitemapNode } from '../../../types/crawl';
import { knowledgeBaseApi } from '../../../services/api/knowledgeBase';
import toast from 'react-hot-toast';
import { SitemapRequest } from '../../../types/sitemap';
import { sitemapApi } from '../../../services/api/sitemap';
import { useBreadcrumbs } from '../../../contexts/BreadcrumbContext';
import { KnowledgeBaseDetail } from '../../../types/knowledge';
import { AxiosError } from 'axios';

const UrlSelectorPage: React.FC = () => {
  const { knowledgeBaseId, sitemapRequestId } = useParams<{ knowledgeBaseId: string, sitemapRequestId: string }>();
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
    knowledgeBaseApi.get(knowledgeBaseId as string).then((response) => {
      setKnowledgeBase(response);
    }).catch(() => {
      toast.error('Failed to load knowledge base');
      navigate('/dashboard/knowledge-base');
    });
  }, [knowledgeBaseId, navigate]);

  useEffect(() => {
    if (!knowledgeBase) return;
    setItems([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Knowledge Bases', href: '/dashboard/knowledge-base' },
      { label: knowledgeBase.title, href: `/dashboard/knowledge-base/${knowledgeBaseId}`},
      { label: 'Import Options', href: `/dashboard/knowledge-base/${knowledgeBaseId}/import`},
      { label: 'Select Sitemap', href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-sitemap`},
      { label: 'Select URLs', href: `/dashboard/knowledge-base/${knowledgeBaseId}/import/select-urls`, current: true },
    ]);
  }, [knowledgeBase, knowledgeBaseId, setItems]);
  
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
        toast.error('Failed to load crawl data');
      }
    };

    fetchCrawlData();
  }, [sitemapRequestId]);
  
  // Load sitemap data
  const loadSitemap = useCallback(async () => {
    try {
      setIsLoadingSitemap(true);
      const data = await sitemapApi.getGraph(sitemapRequestId || "");
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
      toast.error('Failed to load sitemap data');
      setSitemapData(null);
    } finally {
      setIsLoadingSitemap(false);
    }
  }, [sitemapRequestId]);

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
  const getAllUrls = (node: SitemapGraph | SitemapNode | undefined, allUrls: Set<string> = new Set()) => {
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
          if (queryNode && typeof queryNode === 'object' && 'url' in queryNode && typeof queryNode.url === 'string') {
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
      toast.error('Please select at least one URL to import');
      return;
    }

    if (!knowledgeBaseId) {
      toast.error('Knowledge base ID is missing');
      return;
    }

    setIsSubmitting(true);
    const urlsToImport = Array.from(selectedUrls);
    
    try {
      await knowledgeBaseApi.importFromUrls(knowledgeBaseId, { 
        urls: urlsToImport,
      });
      toast.success(`Successfully started import of ${selectedUrls.size} URLs to knowledge base`);
      console.log('Importing URLs:', urlsToImport);
      
      // Navigate back to knowledge base detail page
      navigate(`/dashboard/knowledge-base/${knowledgeBaseId}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error?.response?.data?.message);
      } else {
        console.error('Failed to import URLs:', error);
        toast.error('Failed to import URLs to knowledge base');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render a URL node with checkbox
  const renderUrlNode = (url: string | undefined, title: string | undefined, level: number) => {
    if (!url) return null;
    
    return (
      <div className="flex items-center py-1" style={{ marginLeft: `${level * 1.5}rem` }}>
        <input
          type="checkbox"
          id={`url-${url}`}
          checked={selectedUrls.has(url)}
          onChange={() => toggleUrl(url)}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
        />
        <div className="flex items-center">
          <GlobeAltIcon className="h-5 w-5 text-blue-500 mr-1.5" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-1" title={title || url}>
            {title || url}
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
            title={url}
            onClick={(e) => e.stopPropagation()}
          >
            <LinkIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  };

  // Recursive function to render the sitemap tree with checkboxes
  const renderSitemapTree = (data: SitemapGraph | SitemapNode | undefined, path: string = "", level: number = 0) => {
    if (!data || typeof data !== 'object') {
      return null;
    }

    // If this is a SitemapNode (has URL), render it directly
    if ('url' in data) {
      return renderUrlNode(data.url as string, data.title as string | undefined, level);
    }
    
    // Handle SitemapGraph (object with potential children)
    const filteredEntries = Object.entries(data as Record<string, any>)
      .filter(([key]) => key !== '__self__' && key !== '__query__');
    
    // Sort entries to show folders first, then links
    filteredEntries.sort((a, b) => {
      const [, valueA] = a;
      const [, valueB] = b;
      
      // Check if item A is a folder (has child items)
      const isAFolder = valueA && 
        typeof valueA === 'object' && 
        Object.keys(valueA).filter(k => k !== '__self__' && k !== '__query__').length > 0;
      
      // Check if item B is a folder (has child items)
      const isBFolder = valueB && 
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
      const hasChildren = value && 
        typeof value === 'object' && 
        Object.keys(value || {})
          .filter(k => k !== '__self__' && k !== '__query__')
          .length > 0;
      
      // Get the self node which contains URL and title
      const selfNode = value && 
        typeof value === 'object' && 
        '__self__' in value ? 
        value.__self__ as SitemapNode : 
        null;
      
      // Check if this node has query parameters
      const hasQueries = value && 
        typeof value === 'object' && 
        '__query__' in value && 
        Array.isArray(value.__query__) && 
        value.__query__.length > 0;
        
      // Determine if we should render children
      const shouldRenderChildren = hasChildren && isExpanded;

      // Create a div for this node
      components.push(
        <div key={currentPath} className="py-1 border-b border-gray-200 dark:border-gray-700 last:border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Checkbox with proper spacing */}
              {selfNode && selfNode.url && (
                <input
                  type="checkbox"
                  id={`url-${selfNode.url}`}
                  checked={selectedUrls.has(selfNode.url)}
                  onChange={() => toggleUrl(selfNode.url)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-1"
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginLeft: `${level * 1.5 + 0.5}rem` }}
                />
              )}

              <div
                className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 py-1.5"
                onClick={() => hasChildren && togglePath(currentPath)}
                style={{ marginLeft: selfNode ? '0.25rem' : `${level * 1.5 + 0.5}rem` }}
              >
                {hasChildren ? (
                  <ChevronRightIcon 
                    className={`h-4 w-4 text-gray-400 dark:text-gray-500 mr-1 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
                  />
                ) : (
                  <span className="w-5"></span> 
                )}
                {hasChildren ? (
                  <FolderArrowDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-1.5" />
                ) : (
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-1.5" />
                )}
                <span className="font-medium text-gray-700 dark:text-gray-300">{key}</span>
                
                {/* Show URL icon if this node has a self URL */}
                {selfNode && selfNode.url && (
                  <a
                    href={selfNode.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                    title={`${selfNode.title || key} - ${selfNode.url}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </a>
                )}

                {hasChildren && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    ({Object.keys(value).filter(k => k !== '__self__' && k !== '__query__').length})
                  </span>
                )}
              </div>
            </div>

            {/* Select/Deselect buttons for subtree */}
            {hasChildren && (
              <div className="flex space-x-2 mr-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectSubtree(value as SitemapGraph, true);
                  }}
                  className="text-xs text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Select Tree
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectSubtree(value as SitemapGraph, false);
                  }}
                  className="text-xs text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                >
                  Deselect Tree
                </button>
              </div>
            )}
          </div>

          {isExpanded && (
            <>
              {/* Render query parameters with checkboxes if this node is expanded */}
              {hasQueries && Array.isArray(value.__query__) && value.__query__.map((queryNode: SitemapNode, index: number) => (
                <div key={`${currentPath}-query-${index}`} className="ml-8">
                  {renderUrlNode(queryNode.url as string, queryNode.title as string | undefined, level + 1)}
                </div>
              ))}
                
              {/* Render children recursively */}
              {shouldRenderChildren && (
                <div className="ml-4">
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
          <div key={`${path}-root-query-${index}`} className="ml-8">
            {renderUrlNode(queryNode.url as string, queryNode.title as string | undefined, level + 1)}
          </div>
        );
      });
    }

    return <>{components}</>;
  };

  if (isLoadingSitemap) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Select URLs to Import
            </h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Choose which URLs from {sitemapRequest?.url} you want to add to your knowledge base.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedUrls.size === 0 || isSubmitting}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {selectedUrls.size === 0
                    ? "Select URLs to continue"
                    : `Import ${selectedUrls.size} URLs`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sitemap tree */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Website Structure
          </h2>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-medium text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-xs font-medium text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ml-2"
            >
              Deselect All
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {/* Selected URL counter */}
          <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {selectedUrls.size}
            </span> URLs selected
          </div>
          
          {!sitemapData ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No sitemap data available.
            </div>
          ) : (
            <div className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg max-h-[600px] overflow-y-auto dark:text-gray-300">
              {renderSitemapTree(sitemapData)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UrlSelectorPage;
