import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  ServerIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsProvider';
import { useUser } from '../contexts/UserContext';
import Breadcrumbs from '../components/shared/Breadcrumbs';
import { ArrowLeft } from '../components/shared/DirectionalIcon';
import { LanguageSelector } from '../components/shared/LanguageSelector';
import { ProfileMenu } from '../components/shared/ProfileMenu';

// Admin navigation items - keys for i18n
const adminNavigationKeys = [
  { key: 'admin.dashboard', href: '/manager', icon: HomeIcon, end: true },
  { key: 'admin.manageProxies', href: '/manager/proxies', icon: ServerIcon },
  { key: 'admin.manageLLMProviders', href: '/manager/llm-providers', icon: Cog6ToothIcon },
];

// Reusable Navigation component for admin
interface NavigationMenuProps {
  isMobile?: boolean;
  closeSidebar?: () => void;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ isMobile = false, closeSidebar }) => {
  const { t } = useTranslation();

  return (
    <ul role="list" className="-mx-2 space-y-1">
      {adminNavigationKeys.map(item => (
        <li key={item.key}>
          <NavLink
            to={item.href}
            end={item.end}
            onClick={isMobile ? closeSidebar : undefined}
            className={({ isActive }) =>
              `group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 ${
                isActive
                  ? 'bg-primary-strong/50 text-sidebar-active-text'
                  : 'text-sidebar-text/80 hover:bg-primary-strong/30 hover:text-sidebar-active-text'
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {t(item.key)}
          </NavLink>
        </li>
      ))}
    </ul>
  );
};

export const AdminLayout: React.FC = () => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings } = useSettings();
  const { user } = useUser();
  const navigate = useNavigate();

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
      <div
        className={`fixed inset-0 z-50 transition-all duration-200 ease-in-out lg:hidden ${
          sidebarOpen ? 'visible' : 'invisible'
        }`}
      >
        {/* Background overlay */}
        <div
          className={`fixed inset-0 bg-background/80 transition-opacity duration-200 ease-in-out ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
          onClick={closeSidebar}
        />

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 start-0 z-50 flex w-full max-w-xs transform flex-col overflow-y-auto bg-sidebar-bg transition-transform duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
          }`}
        >
          {/* Close button */}
          <div className="absolute end-4 top-4">
            <button type="button" className="-m-2.5 p-2.5 text-sidebar-text" onClick={closeSidebar}>
              <span className="sr-only">{t('common.close')}</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Logo */}
          <div className="flex h-16 items-center px-6">
            <Link to="/manager" className="flex items-center gap-2">
              <img src="/logo-dark.svg" alt="WaterCrawl Admin" width={32} height={32} />
              <span className="text-lg font-semibold text-sidebar-text">
                {t('admin.panelTitle')}
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
                  className="flex w-full items-center gap-x-3 rounded-md bg-muted p-2 text-sm font-medium leading-6 text-foreground transition-colors hover:bg-muted/80"
                >
                  <ArrowLeft className="h-5 w-5" />
                  {t('admin.exitAdmin')}
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar-bg px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center gap-2">
            <Link to="/manager" className="flex items-center gap-2">
              <img src="/logo-dark.svg" alt="WaterCrawl Admin" width={32} height={32} />
              <span className="text-lg font-semibold text-sidebar-text">
                {t('admin.panelTitle')}
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
              className="flex w-full items-center gap-x-3 rounded-md bg-muted p-2 text-sm font-medium leading-6 text-foreground transition-colors hover:bg-muted/80"
            >
              <ArrowLeft className="h-5 w-5" />
              {t('admin.exitAdmin')}
            </button>
          </div>

          <div className="pb-2 text-center text-xs text-sidebar-text/60">
            <p className="pt-2">
              {t('admin.version')}: <b>{settings?.api_version}</b>
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-col lg:ps-72">
        <main className="flex-1 bg-background">
          <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-muted bg-background/90 px-4 shadow-sm sm:px-6 lg:px-8">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-foreground lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">{t('common.openSidebar')}</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-muted lg:hidden" aria-hidden="true" />

            <div className="flex flex-1 items-center">
              <div className="flex-1">
                <div className="flex w-full items-center justify-between">
                  <div className="text-lg font-semibold text-foreground">
                    {t('admin.panelTitle')}
                  </div>
                  <div className="flex items-center gap-x-4">
                    <LanguageSelector />
                    <ProfileMenu />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Breadcrumbs />

          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
