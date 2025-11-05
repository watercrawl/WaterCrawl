import { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

import {
  Bars3Icon,
  ChartBarIcon,
  HomeIcon,
  XMarkIcon,
  KeyIcon,
  Cog6ToothIcon,
  ClockIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  MapIcon,
  DocumentTextIcon,
  BookOpenIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';

import { TeamSelector } from '../components/dashboard/TeamSelector';
import SpiderIcon from '../components/icons/SpiderIcon';
import { PlansModal } from '../components/plans/PlansModal';
import Breadcrumbs from '../components/shared/Breadcrumbs';
import { ArrowRight } from '../components/shared/DirectionalIcon';
import { GitHubStars } from '../components/shared/GitHubStars';
import { LanguageSelector } from '../components/shared/LanguageSelector';
import NotificationBell from '../components/shared/NotificationBell';
import { PrivacyTermsModal } from '../components/shared/PrivacyTermsModal';
import { ProfileMenu } from '../components/shared/ProfileMenu';
import { useDirection } from '../contexts/DirectionContext';
import { useSettings } from '../contexts/SettingsProvider';
import { useTeam } from '../contexts/TeamContext';
import { useUser } from '../contexts/UserContext';

// Reusable Navigation component
interface NavigationMenuProps {
  isMobile?: boolean;
  expandedMenus: { [key: string]: boolean };
  toggleMenu: (menuName: string) => void;
  isMenuExpanded: (menuName: string) => boolean;
  isMenuActive: (item: any) => boolean;
  closeSidebar?: () => void;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({
  isMobile = false,
  expandedMenus: _expandedMenus, // Renamed to avoid lint error
  toggleMenu,
  isMenuExpanded,
  isMenuActive,
  closeSidebar,
}) => {
  const { user } = useUser();
  const { settings } = useSettings();
  const { direction } = useDirection();
  const { t } = useTranslation();

  const navigation = [
    { name: t('dashboard.navigation.dashboard'), href: '/dashboard', icon: HomeIcon, end: true },
    { name: t('dashboard.navigation.crawl'), href: '/dashboard/crawl', icon: SpiderIcon },
    {
      name: t('dashboard.navigation.search'),
      href: '/dashboard/search',
      icon: MagnifyingGlassIcon,
    },
    { name: t('dashboard.navigation.sitemap'), href: '/dashboard/sitemap', icon: MapIcon },
    ...(settings?.is_knowledge_base_enabled
      ? [
          {
            name: t('dashboard.navigation.knowledgeBase'),
            href: '/dashboard/knowledge-base',
            icon: BookOpenIcon,
          },
        ]
      : []),
    {
      name: t('dashboard.navigation.activityLogs'),
      icon: ClockIcon,
      children: [
        {
          name: t('dashboard.navigation.crawls'),
          href: '/dashboard/logs/crawls',
          icon: SpiderIcon,
        },
        {
          name: t('dashboard.navigation.searches'),
          href: '/dashboard/logs/searches',
          icon: MagnifyingGlassIcon,
        },
        {
          name: t('dashboard.navigation.sitemaps'),
          href: '/dashboard/logs/sitemaps',
          icon: MapIcon,
        },
        {
          name: t('dashboard.navigation.usageHistory'),
          href: '/dashboard/logs/usage',
          icon: DocumentTextIcon,
        },
      ],
    },
    { name: t('dashboard.navigation.apiKeys'), href: '/dashboard/api-keys', icon: KeyIcon },
    { name: t('dashboard.navigation.usage'), href: '/dashboard/usage', icon: ChartBarIcon },
    { name: t('dashboard.navigation.settings'), href: '/dashboard/settings', icon: Cog6ToothIcon },
    {
      name: t('dashboard.navigation.apiReference'),
      href: '/dashboard/api-reference',
      icon: DocumentTextIcon,
    },
  ];
  return (
    <ul role="list" className="-mx-2 space-y-1">
      {navigation.map(item => (
        <li key={item.name}>
          {item.children ? (
            <div className="space-y-1">
              <button
                onClick={() => toggleMenu(item.name)}
                className={`flex w-full items-center justify-between gap-x-3 rounded-md p-2 text-sm font-medium leading-6 transition-colors duration-200 ${
                  isMenuActive(item)
                    ? 'bg-sidebar-active-bg/50 text-sidebar-active-text shadow-sm'
                    : 'text-sidebar-text/80 hover:bg-sidebar-active-bg/50 hover:text-sidebar-active-text'
                }`}
              >
                <div className="flex items-center gap-x-3">
                  <item.icon
                    className={`h-5 w-5 shrink-0 transition-colors duration-200 ${isMenuExpanded(item.name) ? 'text-primary-foreground' : ''}`}
                    aria-hidden="true"
                  />
                  <span
                    className={
                      isMenuExpanded(item.name) ? 'font-medium text-primary-foreground' : ''
                    }
                  >
                    {item.name}
                  </span>
                </div>
                <ChevronDownIcon
                  className={`h-5 w-5 shrink-0 text-primary transition-transform duration-200 ease-in-out ${
                    isMenuExpanded(item.name)
                      ? 'rotate-0'
                      : direction === 'rtl'
                        ? 'rotate-90'
                        : '-rotate-90'
                  }`}
                  aria-hidden="true"
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isMenuExpanded(item.name) ? 'max-h-52 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <ul className="ms-6 mt-2 space-y-2 border-s border-primary/60 ps-3">
                  {item.children.map((child: any) => (
                    <li key={child.name} className="relative">
                      <NavLink
                        to={child.href}
                        onClick={isMobile && closeSidebar ? closeSidebar : undefined}
                        className={({ isActive }) => {
                          return `group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium leading-6 transition-all duration-150 ${
                            isActive
                              ? 'bg-sidebar-active-bg/50 text-sidebar-active-text/80 shadow-sm'
                              : 'text-sidebar-text/80 hover:bg-sidebar-active-bg/50 hover:text-sidebar-active-text'
                          }`;
                        }}
                      >
                        {({ isActive }) => (
                          <>
                            <child.icon
                              className={`h-4 w-4 shrink-0 transition-colors duration-150 ${isActive ? 'text-white' : ''}`}
                              aria-hidden="true"
                            />
                            <span>{child.name}</span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <NavLink
              to={item.href}
              end={item.end}
              onClick={isMobile && closeSidebar ? closeSidebar : undefined}
              className={({ isActive }) =>
                `group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 ${
                  isActive
                    ? 'bg-sidebar-active-bg/50 text-sidebar-active-text/80'
                    : 'text-sidebar-text/80 hover:bg-sidebar-active-bg/50 hover:text-sidebar-active-text/80'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {item.name}
            </NavLink>
          )}
        </li>
      ))}
      {user?.is_superuser && (
        <li key="admin">
          <NavLink
            to="/manager"
            onClick={isMobile && closeSidebar ? closeSidebar : undefined}
            className={({ isActive }) =>
              `group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 ${
                isActive
                  ? 'bg-sidebar-active-bg/50 text-sidebar-active-text/80'
                  : 'text-sidebar-text/80 hover:bg-sidebar-active-bg/50 hover:text-sidebar-active-text/80'
              }`
            }
          >
            <ServerIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {t('dashboard.navigation.adminPanel')} <ArrowRight className="mt-1 h-4 w-4 shrink-0" />
          </NavLink>
        </li>
      )}
    </ul>
  );
};

export const DashboardLayout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { showSubscriptionBanner } = useTeam();
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});
  const { showPrivacyTermsModal } = useUser();

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const isMenuExpanded = (menuName: string) => {
    return expandedMenus[menuName] || false;
  };

  const isMenuActive = (item: any) => {
    if (item.href) {
      return location.pathname === item.href;
    }

    if (item.children) {
      return item.children.some((child: any) => location.pathname === child.href);
    }

    return false;
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div>
      {/* Privicy and Terms confirmation Modal */}
      <PrivacyTermsModal show={showPrivacyTermsModal} />

      {/* Subscription Modal */}
      <PlansModal
        show={!showPrivacyTermsModal && showSubscriptionBanner}
        showEnterprisePlan={false}
      />

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-200 ease-in-out lg:hidden ${
          sidebarOpen ? 'visible' : 'invisible'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-background/80 transition-opacity duration-200 ease-in-out ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 start-0 z-50 flex w-full max-w-xs transform flex-col overflow-y-auto bg-sidebar-bg px-6 py-6 transition-transform duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
          }`}
        >
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2"
            >
              <img src="/logo-dark.svg" alt="WaterCrawl" width={32} height={32} />
              <span className="bg-gradient-to-r from-primary-soft to-primary-soft bg-clip-text text-lg font-semibold text-transparent">
                WaterCrawl
              </span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-primary-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <NavigationMenu
                  isMobile={true}
                  expandedMenus={expandedMenus}
                  toggleMenu={toggleMenu}
                  isMenuExpanded={isMenuExpanded}
                  isMenuActive={isMenuActive}
                  closeSidebar={closeSidebar}
                />
              </li>
              <li className="mt-6">
                <div className="text-xs font-semibold leading-6 text-primary-foreground">
                  TeamSelector Area
                </div>
                <TeamSelector />
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar-bg px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center gap-2">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src="/logo-dark.svg" alt="WaterCrawl" width={32} height={32} />
              <span className="text-lg font-semibold text-sidebar-text">WaterCrawl</span>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <NavigationMenu
                  expandedMenus={expandedMenus}
                  toggleMenu={toggleMenu}
                  isMenuExpanded={isMenuExpanded}
                  isMenuActive={isMenuActive}
                />
              </li>
            </ul>
          </nav>

          <div className="pb-2 text-center text-xs text-sidebar-text/60">
            {/* GitHub Stars */}
            <div className="mb-3 mt-3 px-2">
              <GitHubStars owner="watercrawl" repo="watercrawl" />
            </div>
            {t('common.version')}: <b>{settings?.api_version}</b>
            {/* Copyright */}
            <p className="pt-2 text-xs leading-6 text-sidebar-text/60">
              &copy;{new Date().getFullYear()} - Made with ❤️ by{' '}
              <a
                href="https://watercrawl.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sidebar-text/60 hover:text-primary-foreground"
              >
                <b>WaterCrawl</b>
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-col lg:ps-72">
        <main className="flex-1 bg-background">
          <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:px-6 lg:px-8">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-foreground lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-muted lg:hidden" aria-hidden="true" />

            <div className="flex flex-1 items-center">
              <div className="flex-1">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-x-2 overflow-hidden sm:gap-x-3">
                    <div className="flex-shrink-0">
                      <TeamSelector />
                    </div>
                    <div className="no-scrollbar overflow-x-auto py-1"></div>
                  </div>
                  <div className="flex items-center gap-x-4">
                    <LanguageSelector />
                    <NotificationBell />
                    <ProfileMenu />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="">
            <Breadcrumbs />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
