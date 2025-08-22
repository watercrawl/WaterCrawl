import { useState } from 'react';
import {
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  ServerIcon,
  HomeIcon,
  ArrowLeftIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsProvider';
import { useUser } from '../contexts/UserContext';
import Breadcrumbs from '../components/shared/Breadcrumbs';
import { useTheme } from '../contexts/ThemeContext';

// Admin navigation items
const adminNavigation = [
  { name: 'Admin Dashboard', href: '/admin', icon: HomeIcon, end: true },
  { name: 'Manage Proxies', href: '/admin/proxies', icon: ServerIcon },
  { name: 'Manage LLM Providers', href: '/admin/llm-providers', icon: Cog6ToothIcon },
];

// Reusable Navigation component for admin
interface NavigationMenuProps {
  isMobile?: boolean;
  closeSidebar?: () => void;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({
  isMobile = false,
  closeSidebar
}) => {

  return (
    <ul role="list" className="-mx-2 space-y-1">
      {adminNavigation.map((item) => (
        <li key={item.name}>
          <NavLink
            to={item.href}
            end={item.end}
            onClick={isMobile ? closeSidebar : undefined}
            className={({ isActive }) =>
              `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${isActive
                ? 'bg-gray-800/60 text-gray-300'
                : 'text-gray-200 hover:text-gray-300 hover:bg-gray-800/30'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`h-6 w-6 shrink-0 ${isActive ? 'text-gray-300' : 'text-gray-200 group-hover:text-gray-300'
                    }`}
                  aria-hidden="true"
                />
                {item.name}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
};

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings } = useSettings();
  const { user } = useUser();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Redirect non-superusers away from admin pages
  if (user && !user.is_superuser) {
    navigate('/dashboard');
    return null;
  }


  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div>
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-900/80"
              aria-hidden="true"
              onClick={closeSidebar}
            />

            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 z-50 flex w-full flex-col bg-gray-900 max-w-xs">
              {/* Close button */}
              <div className="absolute right-4 top-4">
                <button
                  type="button"
                  className="-m-2.5 p-2.5 text-gray-200"
                  onClick={closeSidebar}
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              {/* Logo */}
              <div className="flex items-center h-16 px-6">
                <Link to="/admin" className="flex items-center gap-2">
                  <img
                    src="/logo-dark.svg"
                    alt="WaterCrawl Admin"
                    width={32}
                    height={32}
                  />
                  <span className="text-lg font-semibold text-white">
                    Admin Panel
                  </span>
                </Link>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <nav className="flex flex-1 flex-col">
                  <NavigationMenu isMobile={true} closeSidebar={closeSidebar} />

                  <div className="mt-8">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="flex items-center gap-2 px-4 py-2 w-full rounded-md bg-gray-800 text-white hover:bg-gray-900"
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                      Exit Admin
                    </button>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-800 bg-gradient-to-b from-gray-800 to-gray-900 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center gap-2">
            <Link to="/admin" className="flex items-center gap-2">
              <img
                src="/logo-dark.svg"
                alt="WaterCrawl Admin"
                width={32}
                height={32}
              />
              <span className="text-lg font-semibold text-white">
                Admin Panel
              </span>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <NavigationMenu />
              </li>
            </ul>
          </nav>

          <div className="mt-auto">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 w-full rounded-md bg-gray-800 text-white hover:bg-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Exit Admin
            </button>
          </div>

          <div className="text-gray-200/60 text-xs text-center pb-2">
            <p className="pt-2">
              Admin Version: <b>{settings?.api_version}</b>
            </p>
          </div>
        </div>
      </div>

      <div className="lg:pl-72 min-h-screen flex flex-col">
        <main className="bg-gray-50 dark:bg-gray-900 flex-1">
          <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 shadow-sm">
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
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    Admin Panel
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

          <div className="px-4 sm:px-6 lg:px-8 pt-6">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
