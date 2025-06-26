import { BreadcrumbItem } from '../components/shared/Breadcrumbs';

// Dashboard breadcrumb mapping
export const getBreadcrumbs = (path: string, params: Record<string, string> = {}): BreadcrumbItem[] => {
  // Base breadcrumb for dashboard
  const baseBreadcrumb: BreadcrumbItem = { label: 'Dashboard', href: '/dashboard' };
  
  // Split the path and remove empty segments
  const segments = path.split('/').filter(segment => segment);
  
  // Remove 'dashboard' from segments if it's there
  if (segments[0] === 'dashboard') {
    segments.shift();
  }
  
  if (segments.length === 0) {
    // Dashboard home page
    return [{ ...baseBreadcrumb, current: true }];
  }
  
  const breadcrumbs: BreadcrumbItem[] = [baseBreadcrumb];
  
  // Main section mapping
  const sectionLabels: Record<string, string> = {
    'crawl': 'Crawl',
    'search': 'Search',
    'logs': 'Activity Logs',
    'api-keys': 'API Keys',
    'settings': 'Settings',
    'profile': 'Profile',
    'usage': 'Usage',
    'plans': 'Plans',
  };
  
  let currentPath = '/dashboard';
  
  // Build breadcrumbs based on path segments
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Special case handling for IDs and specific paths
    if (segment === 'crawls' && segments[0] === 'logs') {
      breadcrumbs.push({ 
        label: 'Crawl Logs', 
        href: index < segments.length - 1 ? currentPath : undefined,
        current: index === segments.length - 1
      });
    } else if (segment === 'searches' && segments[0] === 'logs') {
      breadcrumbs.push({ 
        label: 'Search Logs', 
        href: index < segments.length - 1 ? currentPath : undefined,
        current: index === segments.length - 1
      });
    } else if (Object.keys(params).includes(segment)) {
      // If the segment is a parameter placeholder and we have a matching param
      const paramValue = params[segment];
      
      // Handle different parameter types
      if (segment === 'requestId') {
        breadcrumbs.push({ 
          label: 'Crawl Details', 
          current: true
        });
      } else if (segment === 'id' && segments.includes('searches')) {
        breadcrumbs.push({ 
          label: 'Search Details', 
          current: true
        });
      } else if (segment === 'crawlRequestId') {
        breadcrumbs.push({ 
          label: 'Select URLs', 
          current: true
        });
      } else {
        // Generic parameter handling
        breadcrumbs.push({ 
          label: `${segment}: ${paramValue}`, 
          href: index < segments.length - 1 ? currentPath : undefined,
          current: index === segments.length - 1
        });
      }
    } else if (sectionLabels[segment]) {
      // Handle known sections
      breadcrumbs.push({ 
        label: sectionLabels[segment], 
        href: index < segments.length - 1 ? currentPath : undefined,
        current: index === segments.length - 1
      });
    } else {
      // Handle unknown segments - convert to title case
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      breadcrumbs.push({ 
        label, 
        href: index < segments.length - 1 ? currentPath : undefined,
        current: index === segments.length - 1
      });
    }
  });
  
  return breadcrumbs;
};
