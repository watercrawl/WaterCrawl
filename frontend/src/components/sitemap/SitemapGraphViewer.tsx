import React, { useState } from 'react';
import { SitemapGraph, SitemapNode } from '../../types/crawl';

interface SitemapGraphViewerProps {
  sitemapData: SitemapGraph | null;
  isLoading: boolean;
}

const SitemapGraphViewer: React.FC<SitemapGraphViewerProps> = ({
  sitemapData,
  isLoading
}) => {
  // Keep track of which nodes have been expanded
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [rootExpanded, setRootExpanded] = useState(true);

  React.useEffect(() => {
    if (sitemapData) {
      // Automatically expand the root level items
      const roots = new Set<string>();

      Object.keys(sitemapData).forEach(key => {
        if (key !== '__self__' && key !== '__query__') {
          roots.add(key);
        }
      });

      setExpandedPaths(roots);
      setRootExpanded(true);
    }
  }, [sitemapData]);

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

  // Calculate the total number of children recursively, including all sublevels
  const getTotalChildCount = (obj: any): number => {
    if (!obj || typeof obj !== 'object') return 0;

    let count = 0;

    // Count all properties except special ones
    for (const key of Object.keys(obj)) {
      if (key !== '__self__' && key !== '__query__') {
        count++; // Count this node

        // If this is an object with children, recursively count them
        if (obj[key] && typeof obj[key] === 'object' && !('url' in obj[key])) {
          count += getTotalChildCount(obj[key]);
        }
      }
    }

    return count;
  };

  // Recursive function to render the sitemap tree
  const renderSitemapTree = (data: SitemapGraph | SitemapNode, path: string = "", level: number = 0) => {
    if (!data) return null;
    // If it's a SitemapNode (has url and title properties)
    if ('url' in data && 'title' in data) {
      data = data as SitemapNode;
      return (
        <div
          key={data.url}
          className="py-1.5"
          style={{ paddingLeft: `${level * 1.5}rem` }}
        >
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline truncate inline-block max-w-xs"
            title={`${data.title || 'No title'}\n${data.url}`}
          >
            {data.title || data.url}
          </a>
        </div>
      );
    }

    // If it's a SitemapGraph (has __self__ property and potentially other nodes)
    const filteredEntries = Object.entries(data).filter(
      ([key]) => key !== '__self__' && key !== '__query__'
    );

    // Prepare components
    const components: JSX.Element[] = [];

    // Render all nodes except special keys
    for (const [key, value] of filteredEntries) {
      const currentPath = path ? `${path}.${key}` : key;

      // Filter out __self__ and __query__ to determine if node has children
      const hasChildren = value &&
        typeof value === 'object' &&
        Object.keys(value)
          .filter(k => k !== '__self__' && k !== '__query__')
          .length > 0;

      const totalChildCount = hasChildren ? getTotalChildCount(value) : 0;

      // Check if this node has a __self__ reference
      const hasSelf = value && typeof value === 'object' && '__self__' in value;
      const selfNode = hasSelf ? (value as SitemapGraph).__self__ : null;

      // Check if this node has query parameters
      const hasQueries =
        value &&
        typeof value === 'object' &&
        '__query__' in value &&
        Array.isArray((value as SitemapGraph).__query__) &&
        ((value as SitemapGraph).__query__?.length ?? 0) > 0;

      const isExpanded = expandedPaths.has(currentPath);
      const shouldRenderChildren = hasChildren && isExpanded;

      // When a node is clicked, toggle its expanded state
      const handleClick = () => {
        togglePath(currentPath);
      };

      components.push(
        <div key={currentPath}>
          <div
            className={`py-1.5 flex items-center ${hasChildren || hasQueries ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}`}
            style={{ paddingLeft: `${level * 1.5}rem` }}
            onClick={(hasChildren || hasQueries) ? handleClick : undefined}
          >
            {/* Only show expand/collapse icons for items with children or queries */}
            {(hasChildren || hasQueries) && (
              <span className="mr-1.5 text-gray-500 dark:text-gray-400">
                {isExpanded ? '▼' : '►'}
              </span>
            )}

            <div className="flex items-center">
              <span
                className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[120px] inline-block"
                title={key}
              >
                {key}
              </span>

              {totalChildCount > 0 && (
                <span className="text-gray-500 dark:text-gray-400 text-xs ml-1" title={`${totalChildCount} sub-items total`}>
                  ({totalChildCount})
                </span>
              )}

              {/* Show __self__ link on the same line */}
              {selfNode && (
                <a
                  href={selfNode.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-600 dark:text-blue-400 hover:underline truncate inline-block max-w-[150px] ml-2 text-sm"
                  title={`${selfNode.title || 'No title'}\n${selfNode.url}`}
                >
                  <span className="text-gray-400 dark:text-gray-500 mr-1">→</span>
                  {selfNode.title || selfNode.url}
                </a>
              )}
            </div>
          </div>

          {/* Render query parameters if this node is expanded */}
          {isExpanded && hasQueries && Array.isArray((value as SitemapGraph).__query__) && (
            <div className="ml-6">
              {(value as SitemapGraph).__query__?.map((queryNode, index) => (
                <div
                  key={`${currentPath}-query-${index}`}
                  className="py-1.5 flex items-center"
                  style={{ paddingLeft: `${(level + 1) * 1.5}rem` }}
                >
                  <a
                    href={queryNode.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline truncate inline-block max-w-xs flex items-center"
                    title={`${queryNode.title || 'No title'}\n${queryNode.url}`}
                  >
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded px-1.5 py-0.5 mr-2 font-medium">
                      query
                    </span>
                    {queryNode.title || queryNode.url}
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Render children if this node is expanded */}
          {shouldRenderChildren && (
            <div className="ml-2">
              {renderSitemapTree(value as SitemapGraph, currentPath, level + 1)}
            </div>
          )}
        </div>
      );
    }

    // Handle root-level query parameters if they exist
    if ('__query__' in data && Array.isArray(data.__query__) && data.__query__?.length > 0) {
      data = data as SitemapGraph;
      data.__query__?.forEach((queryNode, index) => {
        components.push(
          <div
            key={`${path}-root-query-${index}`}
            className="py-1.5 flex items-center"
            style={{ paddingLeft: `${level * 1.5}rem` }}
          >
            <a
              href={queryNode.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline truncate inline-block max-w-xs flex items-center"
              title={`${queryNode.title || 'No title'}\n${queryNode.url}`}
            >
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded px-1.5 py-0.5 mr-2 font-medium">
                query
              </span>
              {queryNode.title || queryNode.url}
            </a>
          </div>
        );
      });
    }

    return <>{components}</>;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Loading sitemap data...
      </div>
    );
  }

  if (!sitemapData) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No sitemap data available.
      </div>
    );
  }

  return (
    <div className="text-sm">
      {rootExpanded ? renderSitemapTree(sitemapData) : (
        <button
          onClick={() => setRootExpanded(true)}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Show Sitemap
        </button>
      )}
    </div>
  );
};

export default SitemapGraphViewer;
