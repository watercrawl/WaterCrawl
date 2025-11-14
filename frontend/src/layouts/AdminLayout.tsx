import { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate } from 'react-router-dom';

import { Bars3Icon, Cog6ToothIcon, ServerIcon, HomeIcon } from '@heroicons/react/24/outline';

import Breadcrumbs from '../components/shared/Breadcrumbs';
import { ArrowLeft } from '../components/shared/DirectionalIcon';
import { LanguageSelector } from '../components/shared/LanguageSelector';
import { ProfileMenu } from '../components/shared/ProfileMenu';
import {
  Sidebar,
  SidebarNavigationItem,
  MobileSidebarContainer,
  DesktopSidebarContainer,
} from '../components/shared/Sidebar';
import { useSettings } from '../contexts/SettingsProvider';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';

export const AdminLayout: React.FC = () => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings } = useSettings();
  const { user } = useUser();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  // Redirect non-superusers away from admin pages
  if (user && !user.is_superuser) {
    navigate('/dashboard');
    return null;
  }

  const closeSidebar = () => setSidebarOpen(false);

  // Admin navigation items
  const navigation: SidebarNavigationItem[] = [
    { name: t('admin.dashboard'), href: '/manager', icon: HomeIcon, end: true },
    { name: t('admin.manageProxies'), href: '/manager/proxies', icon: ServerIcon },
    { name: t('admin.manageLLMProviders'), href: '/manager/llm-providers', icon: Cog6ToothIcon },
  ];

  // Footer content
  const sidebarFooter = (
    <div className="space-y-3">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex w-full items-center gap-x-3 rounded-lg bg-muted p-2.5 text-sm font-medium leading-6 text-foreground transition-colors hover:bg-muted/80"
      >
        <ArrowLeft className="h-5 w-5" />
        {t('admin.exitAdmin')}
      </button>
      <div className="text-center text-xs text-muted-foreground">
        {t('admin.version')}: <b>{settings?.api_version}</b>
      </div>
    </div>
  );

  return (
    <div>
      {/* Mobile Sidebar */}
      <MobileSidebarContainer isOpen={sidebarOpen} onClose={closeSidebar}>
        <Sidebar
          logo={!isDark ? '/logo.svg' : '/logo-dark.svg'}
          logoAlt="WaterCrawl Admin"
          title={t('admin.panelTitle')}
          subtitle="Administration Panel"
          titleLink="/manager"
          navigation={navigation}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
          isMobile={true}
          footer={sidebarFooter}
        />
      </MobileSidebarContainer>

      {/* Desktop Sidebar */}
      <DesktopSidebarContainer>
        <Sidebar
          logo={!isDark ? '/logo.svg' : '/logo-dark.svg'}
          logoAlt="WaterCrawl Admin"
          title={t('admin.panelTitle')}
          subtitle="Administration Panel"
          titleLink="/manager"
          navigation={navigation}
          footer={sidebarFooter}
        />
      </DesktopSidebarContainer>

      {/* Main Content */}
      <div className="flex min-h-screen flex-col lg:ps-64">
        <main className="flex-1 bg-background">
          {/* Top Header */}
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

          {/* Breadcrumbs */}
          <Breadcrumbs />

          {/* Page Content */}
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
