import React from 'react';

import { Link, NavLink } from 'react-router-dom';

import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { useDirection } from '../../contexts/DirectionContext';

export interface SidebarNavigationItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  badge?: string | number;
  separator?: boolean; // Add separator before this item
  children?: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }>;
}

interface SidebarProps {
  // Core props
  logo: string;
  logoAlt: string;
  title: string;
  subtitle?: string;
  titleLink: string;
  navigation: SidebarNavigationItem[];

  // Mobile specific
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;

  // Optional features
  footer?: React.ReactNode;
  header?: React.ReactNode;

  // State management for expandable menus
  expandedMenus?: { [key: string]: boolean };
  onToggleMenu?: (menuName: string) => void;
  isMenuActive?: (item: SidebarNavigationItem) => boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  logo,
  logoAlt,
  title,
  subtitle = 'Web Crawling Platform',
  titleLink,
  navigation,
  isOpen,
  onClose,
  isMobile = false,
  footer,
  header,
  expandedMenus = {},
  onToggleMenu,
  isMenuActive,
}) => {
  const { direction } = useDirection();

  const isMenuExpanded = (menuName: string) => expandedMenus[menuName] || false;

  const sidebarClasses = isMobile
    ? `fixed inset-y-0 start-0 z-50 flex w-full max-w-xs transform flex-col overflow-y-auto bg-card border-e border-border shadow-2xl transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
      }`
    : 'flex h-full grow flex-col overflow-y-auto bg-card border-e border-border shadow-lg';

  return (
    <div className={sidebarClasses}>
      {/* Header / Logo */}
      <div
        className={`flex shrink-0 items-center border-b border-border/50 ${isMobile ? 'h-14 justify-between px-4' : 'h-16 gap-2.5 px-4'}`}
      >
        <Link
          to={titleLink}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          onClick={isMobile ? onClose : undefined}
        >
          <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-1 shadow-sm">
            <img src={logo} alt={logoAlt} width={38} height={38} className="shrink-0" />
          </div>
          <div>
            <span className="block text-sm font-bold tracking-tight text-foreground">{title}</span>
            {subtitle && (
              <span className="block text-[11px] text-muted-foreground">{subtitle}</span>
            )}
          </div>
        </Link>

        {isMobile && onClose && (
          <button
            type="button"
            className="-m-2 rounded-lg p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            onClick={onClose}
          >
            <span className="sr-only">Close sidebar</span>
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Optional Header Content */}
      {header && <div className={isMobile ? 'px-6' : ''}>{header}</div>}

      {/* Navigation */}
      <nav className={`flex flex-1 flex-col ${isMobile ? 'px-3 py-3' : 'px-3 py-4'}`}>
        <ul role="list" className="space-y-0.5">
          {navigation.map((item, index) => (
            <li key={item.name}>
              {/* Separator */}
              {item.separator && index > 0 && <div className="my-2 border-t border-border/50" />}
              {item.children ? (
                // Expandable menu item
                <div className="space-y-1">
                  <button
                    onClick={() => onToggleMenu?.(item.name)}
                    className={`group flex w-full items-center justify-between gap-x-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200 ${
                      isMenuActive?.(item)
                        ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm ring-1 ring-primary/20'
                        : 'text-foreground hover:bg-gradient-to-r hover:from-primary-soft/30 hover:to-transparent hover:text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-x-2.5">
                      <div
                        className={`rounded-md p-1 transition-all ${
                          isMenuActive?.(item)
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </div>
                      <span className={isMenuExpanded(item.name) ? 'font-semibold' : ''}>
                        {item.name}
                      </span>
                    </div>
                    <ChevronDownIcon
                      className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-300 ${
                        isMenuExpanded(item.name)
                          ? 'rotate-0'
                          : direction === 'rtl'
                            ? 'rotate-90'
                            : '-rotate-90'
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Submenu */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isMenuExpanded(item.name)
                        ? 'mt-0.5 max-h-96 opacity-100'
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    <ul className="ms-6 space-y-0.5 border-s-2 border-primary/20 ps-3">
                      {item.children.map(child => (
                        <li key={child.name}>
                          <NavLink
                            to={child.href}
                            onClick={isMobile ? onClose : undefined}
                            className={({ isActive }) =>
                              `group flex items-center gap-x-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200 ${
                                isActive
                                  ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm ring-1 ring-primary/20'
                                  : 'text-foreground hover:bg-gradient-to-r hover:from-primary-soft/30 hover:to-transparent hover:text-primary'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <div
                                  className={`rounded-md p-1 transition-all ${
                                    isActive
                                      ? 'bg-primary text-primary-foreground shadow-sm'
                                      : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                  }`}
                                >
                                  <child.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                </div>
                                <span>{child.name}</span>
                                {isActive && (
                                  <div className="ms-auto h-1.5 w-1.5 rounded-full bg-primary" />
                                )}
                              </>
                            )}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                // Regular menu item
                <NavLink
                  to={item.href!}
                  end={item.end}
                  onClick={isMobile ? onClose : undefined}
                  className={({ isActive }) =>
                    `group flex items-center gap-x-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm ring-1 ring-primary/20'
                        : 'text-foreground hover:bg-gradient-to-r hover:from-primary-soft/30 hover:to-transparent hover:text-primary'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={`rounded-md p-1 transition-all ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </div>
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      {footer && (
        <div
          className={`mt-auto border-t border-border/50 ${isMobile ? 'px-3 py-3' : 'px-3 py-3'}`}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

interface SidebarContainerProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebarContainer: React.FC<SidebarContainerProps> = ({
  children,
  isOpen,
  onClose,
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ease-out lg:hidden ${
        isOpen ? 'visible' : 'invisible'
      }`}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      {children}
    </div>
  );
};

export const DesktopSidebarContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      {children}
    </div>
  );
};
