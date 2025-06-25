// Type declarations for sitemap components
declare module './SitemapResultDisplay' {
  import React from 'react';
  import { SitemapRequest } from '../../types/sitemap';
  
  export interface SitemapResultDisplayProps {
    result: SitemapRequest;
    loading?: boolean;
    onDownload: () => void;
  }
  
  export const SitemapResultDisplay: React.FC<SitemapResultDisplayProps>;
}

declare module './SitemapApiDocumentation' {
  import React from 'react';
  
  export interface SitemapApiDocumentationProps {
    url?: string;
    includeSubdomains?: boolean;
  }
  
  export const SitemapApiDocumentation: React.FC<SitemapApiDocumentationProps>;
}
