import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SitemapGraph, SitemapNode } from '../../types/crawl';

interface SitemapGraphViewerProps {
  sitemapData: SitemapGraph | null;
  isLoading: boolean;
}

const SitemapGraphViewer: React.FC<SitemapGraphViewerProps> = ({ sitemapData, isLoading }) => {
  const { t } = useTranslation();
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
  const renderSitemapTree = (
    data: SitemapGraph | SitemapNode,
    path: string = '',
    level: number = 0
  ) => {
    if (!data) return null;
    // If it's a SitemapNode (has url and title properties)
    if ('url' in data && 'title' in data) {
      data = data as SitemapNode;
      return (
        <div key={data.url} className="py-1.5" style={{ paddingInlineStart: `${level * 1.5}rem` }}>
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block max-w-xs truncate text-primary hover:underline"
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
      const hasChildren =
        value &&
        typeof value === 'object' &&
        Object.keys(value).filter(k => k !== '__self__' && k !== '__query__').length > 0;

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
            className={`flex items-center py-1.5 ${hasChildren || hasQueries ? 'cursor-pointer hover:bg-muted' : ''}`}
            style={{ paddingInlineStart: `${level * 1.5}rem` }}
            onClick={hasChildren || hasQueries ? handleClick : undefined}
          >
            {/* Only show expand/collapse icons for items with children or queries */}
            {(hasChildren || hasQueries) && (
              <span className="me-1.5 text-muted-foreground">{isExpanded ? '▼' : '►'}</span>
            )}

            <div className="flex items-center">
              <span
                className="inline-block max-w-[120px] truncate font-medium text-foreground"
                title={key}
              >
                {key}
              </span>

              {totalChildCount > 0 && (
                <span
                  className="ms-1 text-xs text-muted-foreground"
                  title={`${totalChildCount} sub-items total`}
                >
                  ({totalChildCount})
                </span>
              )}

              {/* Show __self__ link on the same line */}
              {selfNode && (
                <a
                  href={selfNode.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="ms-2 inline-block max-w-[150px] truncate text-sm text-primary hover:underline"
                  title={`${selfNode.title || 'No title'}\n${selfNode.url}`}
                >
                  <span className="me-1 text-muted-foreground">→</span>
                  {selfNode.title || selfNode.url}
                </a>
              )}
            </div>
          </div>

          {/* Render query parameters if this node is expanded */}
          {isExpanded && hasQueries && Array.isArray((value as SitemapGraph).__query__) && (
            <div className="ms-6">
              {(value as SitemapGraph).__query__?.map((queryNode, index) => (
                <div
                  key={`${currentPath}-query-${index}`}
                  className="flex items-center py-1.5"
                  style={{ paddingInlineStart: `${(level + 1) * 1.5}rem` }}
                >
                  <a
                    href={queryNode.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block flex max-w-xs items-center truncate text-primary hover:underline"
                    title={`${queryNode.title || 'No title'}\n${queryNode.url}`}
                  >
                    <span className="me-2 rounded bg-primary-light px-1.5 py-0.5 text-xs font-medium text-primary-dark">
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
            <div className="ms-2">
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
            className="flex items-center py-1.5"
            style={{ paddingInlineStart: `${level * 1.5}rem` }}
          >
            <a
              href={queryNode.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block flex max-w-xs items-center truncate text-primary hover:underline"
              title={`${queryNode.title || 'No title'}\n${queryNode.url}`}
            >
              <span className="me-2 rounded bg-primary-light px-1.5 py-0.5 text-xs font-medium text-primary-dark">
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
    return <div className="py-8 text-center text-muted-foreground">{t('sitemap.loading')}</div>;
  }

  if (!sitemapData) {
    return <div className="py-8 text-center text-muted-foreground">{t('sitemap.noData')}</div>;
  }

  return (
    <div className="text-sm">
      {rootExpanded ? (
        renderSitemapTree(sitemapData)
      ) : (
        <button
          onClick={() => setRootExpanded(true)}
          className="font-medium text-primary hover:text-primary-dark"
        >
          {t('sitemap.showSitemap')}
        </button>
      )}
    </div>
  );
};

export default SitemapGraphViewer;
