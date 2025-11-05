import React from 'react';

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { HomeIcon } from '@heroicons/react/24/solid';

import { ChevronRight } from '../../components/shared/DirectionalIcon';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

interface BreadcrumbsProps {
  homeHref?: string;
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ homeHref = '/dashboard', className = '' }) => {
  const { t } = useTranslation();
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
              <Link to={homeHref} className="text-muted-foreground hover:text-muted-foreground">
                <HomeIcon className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />
                <span className="sr-only">{t('common.home')}</span>
              </Link>
            </div>
          </li>

          {/* On mobile, show a condensed version with ellipsis for earlier items */}
          <li className="sm:hidden">
            <div className="flex items-center">
              <Link to={homeHref} className="text-muted-foreground hover:text-muted-foreground">
                <HomeIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              </Link>
            </div>
          </li>

          {/* Hidden breadcrumbs on mobile */}
          {items.slice(0, -2).map((item, index) => (
            <li key={`${item.label}-${index}`} className="hidden sm:block">
              <div className="flex items-center">
                <ChevronRight
                  className="h-4 w-4 flex-shrink-0 text-muted-foreground sm:h-5 sm:w-5"
                  aria-hidden="true"
                />
                {item.href ? (
                  <Link
                    to={item.href}
                    className="ms-2 text-xs font-medium text-muted-foreground hover:text-foreground sm:ms-3 sm:text-sm"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="ms-2 text-xs font-medium text-muted-foreground sm:ms-3 sm:text-sm">
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
                <ChevronRight
                  className="h-4 w-4 flex-shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="ms-1 text-xs font-medium text-muted-foreground">...</span>
              </div>
            </li>
          )}

          {/* Last two items - always visible */}
          {items.slice(-2).map((item, index) => (
            <li key={`last-${item.label}-${index}`}>
              <div className="flex items-center">
                <ChevronRight
                  className="h-4 w-4 flex-shrink-0 text-muted-foreground sm:h-5 sm:w-5"
                  aria-hidden="true"
                />
                {item.href && !item.current ? (
                  <Link
                    to={item.href}
                    className="ms-2 max-w-[100px] truncate text-xs font-medium text-muted-foreground hover:text-foreground sm:ms-3 sm:max-w-xs sm:text-sm"
                    aria-current={item.current ? 'page' : undefined}
                    title={item.label}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="ms-2 max-w-[100px] truncate text-xs font-medium text-foreground sm:ms-3 sm:max-w-xs sm:text-sm"
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
              <Link to={homeHref} className="text-muted-foreground hover:text-muted-foreground">
                <HomeIcon className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />
                <span className="sr-only">{t('common.home')}</span>
              </Link>
            </div>
          </li>
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`}>
              <div className="flex items-center">
                <ChevronRight
                  className="h-4 w-4 flex-shrink-0 text-muted-foreground sm:h-5 sm:w-5"
                  aria-hidden="true"
                />
                {item.href && !item.current ? (
                  <Link
                    to={item.href}
                    className="ms-2 max-w-[100px] truncate text-xs font-medium text-muted-foreground hover:text-foreground sm:ms-3 sm:max-w-xs sm:text-sm"
                    aria-current={item.current ? 'page' : undefined}
                    title={item.label}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="ms-2 max-w-[100px] truncate text-xs font-medium text-foreground sm:ms-3 sm:max-w-xs sm:text-sm"
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

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-2 sm:px-6 sm:py-3">
      <nav className={`flex ${className}`} aria-label="Breadcrumb">
        <ol className="flex items-center gap-x-1 sm:gap-x-2">{renderItems()}</ol>
      </nav>
    </div>
  );
};

export default Breadcrumbs;
