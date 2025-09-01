import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

interface BreadcrumbsProps {
  homeHref?: string;
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ 
  homeHref = '/dashboard', 
  className = '' 
}) => {
  const { items } = useBreadcrumbs();
  // Function to render breadcrumb items with responsive design
  const renderItems = () => {
    // For very small screens, only show the last two breadcrumbs
    if (items.length > 2) {
      return (
        <>
          {/* Always visible items */}
          <li className="hidden sm:block">
            <div>
              <Link
                to={homeHref}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              >
                <HomeIcon className="flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                <span className="sr-only">Home</span>
              </Link>
            </div>
          </li>
          
          {/* On mobile, show a condensed version with ellipsis for earlier items */}
          <li className="sm:hidden">
            <div className="flex items-center">
              <Link
                to={homeHref}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              >
                <HomeIcon className="flex-shrink-0 h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </li>
          
          {/* Hidden breadcrumbs on mobile */}
          {items.slice(0, -2).map((item, index) => (
            <li key={`${item.label}-${index}`} className="hidden sm:block">
              <div className="flex items-center">
                <ChevronRightIcon
                  className="flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-600"
                  aria-hidden="true"
                />
                {item.href ? (
                  <Link
                    to={item.href}
                    className="ml-2 sm:ml-3 text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="ml-2 sm:ml-3 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    {item.label}
                  </span>
                )}
              </div>
            </li>
          ))}
          
          {/* Ellipsis for mobile */}
          {items.length > 2 && (
            <li className="sm:hidden">
              <div className="flex items-center">
                <ChevronRightIcon
                  className="flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-600"
                  aria-hidden="true"
                />
                <span className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">...</span>
              </div>
            </li>
          )}
          
          {/* Last two items - always visible */}
          {items.slice(-2).map((item, index) => (
            <li key={`last-${item.label}-${index}`}>
              <div className="flex items-center">
                <ChevronRightIcon
                  className="flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-600"
                  aria-hidden="true"
                />
                {item.href && !item.current ? (
                  <Link
                    to={item.href}
                    className="ml-2 sm:ml-3 text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 truncate max-w-[100px] sm:max-w-xs"
                    aria-current={item.current ? 'page' : undefined}
                    title={item.label}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="ml-2 sm:ml-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[100px] sm:max-w-xs"
                    aria-current={item.current ? 'page' : undefined}
                    title={item.label}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            </li>
          ))}
        </>
      );
    } else {
      // For 2 or fewer items, show all with responsive design
      return (
        <>
          <li>
            <div>
              <Link
                to={homeHref}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              >
                <HomeIcon className="flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                <span className="sr-only">Home</span>
              </Link>
            </div>
          </li>
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`}>
              <div className="flex items-center">
                <ChevronRightIcon
                  className="flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-600"
                  aria-hidden="true"
                />
                {item.href && !item.current ? (
                  <Link
                    to={item.href}
                    className="ml-2 sm:ml-3 text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 truncate max-w-[100px] sm:max-w-xs"
                    aria-current={item.current ? 'page' : undefined}
                    title={item.label}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="ml-2 sm:ml-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[100px] sm:max-w-xs"
                    aria-current={item.current ? 'page' : undefined}
                    title={item.label}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            </li>
          ))}
        </>
      );
    }
  };

  if(items.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-2 sm:px-6 sm:py-3">
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1 sm:space-x-2">
        {renderItems()}
      </ol>
    </nav>
    </div>
  );
};

export default Breadcrumbs;
