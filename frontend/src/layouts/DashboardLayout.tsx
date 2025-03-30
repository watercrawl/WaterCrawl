import { useState } from 'react';
import {
  Bars3Icon,
  ChartBarIcon,
  HomeIcon,
  XMarkIcon,
  BeakerIcon,
  KeyIcon,
  Cog6ToothIcon,
  ClockIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { TeamSelector } from '../components/dashboard/TeamSelector';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationBanner } from '../components/common/NotificationBanner';
import { APP_VERSION } from '../utils/env';
import { useSettings } from '../contexts/SettingsProvider';
import { useTeam } from '../contexts/TeamContext';
import Loading from '../components/shared/Loading';
import { useUser } from '../contexts/UserContext';
import { PrivacyTermsModal } from '../components/shared/PrivacyTermsModal';
import { GitHubStars } from '../components/shared/GitHubStars';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, end: true },
  { name: 'Playground', href: '/dashboard/playground', icon: BeakerIcon },
  { name: 'Activity Logs', href: '/dashboard/logs', icon: ClockIcon },
  { name: 'Usage', href: '/dashboard/usage', icon: ChartBarIcon },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: KeyIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
  { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
];

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { settings, isCompatibleBackend, compatibleBackendVersion, loading } = useSettings();
  const { showSubscriptionBanner } = useTeam();
  const { showPrivacyTermsModal } = useUser();


  if (!settings) {
    return (
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {loading ?
            (<div className="flex items-center justify-center">
              <Loading />
            </div>)
            : (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                There is a problem with load settings. Please try again later.
              </p>
            )}
        </div>
      </div>
    )
  }



  return (
    <div>
      {/* Check version Compatibility */}
      <NotificationBanner
        show={isCompatibleBackend === false}
        onClose={() => { }}
        closeable={false}
        variant="error"
        icon={<XCircleIcon className="h-6 w-6" aria-hidden="true" />}
      >
        Your backend version is not compatible with the current frontend version. <br />
        The current backend version is <b>{settings?.api_version}</b> and the compatible backend version is <b>{compatibleBackendVersion}</b>.
      </NotificationBanner>

      {/* Global Notification Area */}
      <NotificationBanner
        show={showSubscriptionBanner}
        onClose={() => { }}
        closeable={false}
        variant="warning"
        icon={<InformationCircleIcon className="h-6 w-6" aria-hidden="true" />}
      >
        You are not activate your Freemium plan. Lets upgrade now to unlock the features.{' '}
        <Link to="/dashboard/plans" className="underline">
          Upgrade now
        </Link>
      </NotificationBanner>

      {/* Privicy and Terms confirmation Modal */}
      <PrivacyTermsModal show={showPrivacyTermsModal} />

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
          className={`fixed inset-y-0 left-0 flex w-full max-w-xs transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button
                type="button"
                className="-m-2.5 p-2.5"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-blue-950 to-blue-900 px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center">
                <Link to="/dashboard" className="flex items-center space-x-2">
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
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <NavLink
                            to={item.href}
                            end={item.end}
                            onClick={() => setSidebarOpen(false)}
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
                        </li>
                      ))}
                    </ul>
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
                Frontend Version: <b>{APP_VERSION}</b> <br />
                Backend Version: <b>{settings?.api_version}</b>
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
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-blue-950 to-blue-900 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
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
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <NavLink
                        to={item.href}
                        end={item.end}
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
                    </li>
                  ))}
                </ul>
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
            
            Frontend Version: <b>{APP_VERSION}</b> <br />
            Backend Version: <b>{settings?.api_version}</b>

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
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
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

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <TeamSelector />
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <main className="bg-gray-50 dark:bg-gray-900 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
