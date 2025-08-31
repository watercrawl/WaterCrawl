import { useState } from 'react';
import {
  Bars3Icon,
  ChartBarIcon,
  HomeIcon,
  XMarkIcon,
  KeyIcon,
  Cog6ToothIcon,
  ClockIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  MapIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { TeamSelector } from '../components/dashboard/TeamSelector';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsProvider';
import { useTeam } from '../contexts/TeamContext';
import { useUser } from '../contexts/UserContext';
import { PrivacyTermsModal } from '../components/shared/PrivacyTermsModal';
import { GitHubStars } from '../components/shared/GitHubStars';
import SpiderIcon from '../components/icons/SpiderIcon';
import Breadcrumbs from '../components/shared/Breadcrumbs';
import { getBreadcrumbs } from '../utils/breadcrumbs';
import { PlansModal } from '../components/plans/PlansModal';


const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, end: true },
  { name: 'Crawl', href: '/dashboard/crawl', icon: SpiderIcon },
  { name: 'Search', href: '/dashboard/search', icon: MagnifyingGlassIcon },
  { name: 'Sitemap', href: '/dashboard/sitemap', icon: MapIcon },
  {
    name: 'Activity Logs',
    icon: ClockIcon,
    children: [
      { name: 'Crawls', href: '/dashboard/logs/crawls', icon: SpiderIcon },
      { name: 'Searches', href: '/dashboard/logs/searches', icon: MagnifyingGlassIcon },
      { name: 'Sitemaps', href: '/dashboard/logs/sitemaps', icon: MapIcon },
    ]
  },
  { name: 'Usage', href: '/dashboard/usage', icon: ChartBarIcon },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: KeyIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
  { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
  { name: 'API Reference', href: '/dashboard/api-reference', icon: DocumentTextIcon },
];

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
  closeSidebar
}) => {
  return (
    <ul role="list" className="-mx-2 space-y-1">
      {navigation.map((item) => (
        <li key={item.name}>
          {item.children ? (
            <div className="space-y-1">
              <button
                onClick={() => toggleMenu(item.name)}
                className={`w-full flex justify-between items-center gap-x-3 rounded-md p-2 text-sm font-medium leading-6 transition-colors duration-200 ${isMenuActive(item)
                  ? 'bg-blue-800/60 text-blue-100'
                  : 'text-blue-200 hover:text-blue-100 hover:bg-blue-800/30'
                  }`}
              >
                <div className="flex items-center gap-x-3">
                  <item.icon
                    className={`h-5 w-5 shrink-0 transition-colors duration-200 ${isMenuExpanded(item.name) ? 'text-blue-100' : ''}`}
                    aria-hidden="true"
                  />
                  <span className={isMenuExpanded(item.name) ? 'font-medium text-blue-100' : ''}>{item.name}</span>
                </div>
                <ChevronDownIcon
                  className={`h-5 w-5 shrink-0 text-blue-300 transition-transform duration-200 ease-in-out ${isMenuExpanded(item.name) ? 'rotate-0' : '-rotate-90'}`}
                  aria-hidden="true"
                />
              </button>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMenuExpanded(item.name) ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <ul className="ml-6 mt-2 space-y-2 pl-3 border-l border-blue-700/60">
                  {item.children.map((child: any) => (
                    <li key={child.name} className="relative">
                      <NavLink
                        to={child.href}
                        onClick={isMobile && closeSidebar ? closeSidebar : undefined}
                        className={({ isActive }) => {
                          return `group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium leading-6 transition-all duration-150 ${isActive
                            ? 'bg-blue-700/50 text-white shadow-sm'
                            : 'text-blue-300 hover:text-blue-100 hover:bg-blue-800/40'
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
                `group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 ${isActive
                  ? 'bg-blue-800/50 text-blue-100'
                  : 'text-blue-200 hover:text-blue-100 hover:bg-blue-800/30'
                }`
              }
            >
              <item.icon
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          )}
        </li>
      ))}
    </ul>
  );
};

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();
  const location = useLocation();
  const { showSubscriptionBanner } = useTeam();
  const { showPrivacyTermsModal } = useUser();

  // Get breadcrumbs based on current path
  const breadcrumbItems = getBreadcrumbs(location.pathname);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
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
      <PlansModal show={!showPrivacyTermsModal && showSubscriptionBanner} showEnterprisePlan={false}/>

      {/* Mobile menu */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-all duration-200 ease-in-out ${sidebarOpen ? 'visible' : 'invisible'
          }`}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-gray-900/80 transition-opacity duration-200 ease-in-out ${sidebarOpen ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 flex w-full max-w-xs transform flex-col overflow-y-auto bg-blue-950 px-6 py-6 transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2"
            >
              <img
                src="/logo-dark.svg"
                alt="WaterCrawl"
                width={32}
                height={32}
              />
              <span className="text-lg font-semibold bg-gradient-to-r from-blue-200 to-blue-100 bg-clip-text text-transparent">
                WaterCrawl
              </span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-blue-200"
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
                <div className="text-xs font-semibold leading-6 text-blue-200">TeamSelector Area</div>
                <TeamSelector />

              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-blue-950 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center gap-2">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img
                src="/logo-dark.svg"
                alt="WaterCrawl"
                width={32}
                height={32}
              />
              <span className="text-lg font-semibold bg-gradient-to-r from-blue-200 to-blue-100 bg-clip-text text-transparent">
                WaterCrawl
              </span>
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


          <div className="text-blue-200/60 text-xs text-center pb-2">
            {/* GitHub Stars */}
            <div className="mt-3 mb-3 px-2">
              <GitHubStars
                owner="watercrawl"
                repo="watercrawl"
              />
            </div>

            Version: <b>{settings?.api_version}</b>

            {/* Copyright */}
            <p className="text-xs leading-6 text-blue-200/60 pt-2">
              &copy;{new Date().getFullYear()} - Made with ❤️ by{' '}
              <a
                href="https://watercrawl.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-200/60 hover:text-blue-100"
              >
                <b>WaterCrawl</b>
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <main className="bg-gray-50 dark:bg-gray-900 flex-1">
          <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 shadow-sm">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-200 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 lg:hidden" aria-hidden="true" />

            <div className="flex flex-1 items-center">
              <div className="flex-1">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
                    <div className="flex-shrink-0">
                      <TeamSelector />
                    </div>
                    <div className="overflow-x-auto py-1 no-scrollbar">

                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="flex-shrink-0 p-1.5 sm:p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 ml-2"
                    aria-label="Toggle theme"
                  >
                    {theme === 'dark' ? (
                      <SunIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <MoonIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
