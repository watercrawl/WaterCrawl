import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Breadcrumbs from './Breadcrumbs';
import { getBreadcrumbs } from '../../utils/breadcrumbs';

/**
 * Higher-order component that adds breadcrumbs to any dashboard page
 */
const WithBreadcrumbs = <P extends object>(
  Component: React.ComponentType<P>,
  className: string = 'mb-4'
): React.FC<P> => {
  // Create a wrapper component that includes breadcrumbs
  const WithBreadcrumbsComponent: React.FC<P> = (props) => {
    const location = useLocation();
    const params = useParams();
    
    // Convert params to Record<string, string> by filtering out undefined values
    const stringParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        stringParams[key] = value;
      }
    });
    
    // Get breadcrumbs for the current path
    const breadcrumbs = getBreadcrumbs(location.pathname, stringParams);
    
    return (
      <>
        <Breadcrumbs items={breadcrumbs} className={className} />
        <Component {...props} />
      </>
    );
  };
  
  // Set display name for debugging
  const componentName = Component.displayName || Component.name || 'Component';
  WithBreadcrumbsComponent.displayName = `WithBreadcrumbs(${componentName})`;
  
  return WithBreadcrumbsComponent;
};

export default WithBreadcrumbs;
