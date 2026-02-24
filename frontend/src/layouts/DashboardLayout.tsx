import { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';

import {
  Bars3Icon,
  ChartBarIcon,
  HomeIcon,
  KeyIcon,
  Cog6ToothIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  MapIcon,
  DocumentTextIcon,
  BookOpenIcon,
  ServerIcon,
  CpuChipIcon,
  WrenchIcon,
  FolderIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

import { TeamSelector } from '../components/dashboard/TeamSelector';
import SpiderIcon from '../components/icons/SpiderIcon';
import { PlansModal } from '../components/plans/PlansModal';
import Breadcrumbs from '../components/shared/Breadcrumbs';
import { GitHubStars } from '../components/shared/GitHubStars';
import { LanguageSelector } from '../components/shared/LanguageSelector';
import NotificationBell from '../components/shared/NotificationBell';
import { PrivacyTermsModal } from '../components/shared/PrivacyTermsModal';
import { ProfileMenu } from '../components/shared/ProfileMenu';
import {
  Sidebar,
  SidebarNavigationItem,
  MobileSidebarContainer,
  DesktopSidebarContainer,
} from '../components/shared/Sidebar';
import { useSettings } from '../contexts/SettingsProvider';
import { useTeam } from '../contexts/TeamContext';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';

export const DashboardLayout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { showSubscriptionBanner } = useTeam();
  const { settings } = useSettings();
  const { user } = useUser();
  const { showPrivacyTermsModal } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});
  const { isDark } = useTheme();

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const isMenuActive = (item: SidebarNavigationItem) => {
    if (item.href) {
      return location.pathname === item.href;
    }

    if (item.children) {
      return item.children.some(child => location.pathname === child.href);
    }

    return false;
  };

  const closeSidebar = () => setSidebarOpen(false);

  // Build navigation items
  const navigation: SidebarNavigationItem[] = [
    { name: t('dashboard.navigation.dashboard'), href: '/dashboard', icon: HomeIcon, end: true },
    { name: t('dashboard.navigation.crawl'), href: '/dashboard/crawl', icon: SpiderIcon },
    {
      name: t('dashboard.navigation.search'),
      href: '/dashboard/search',
      icon: MagnifyingGlassIcon,
    },
    { name: t('dashboard.navigation.sitemap'), href: '/dashboard/sitemap', icon: MapIcon },
    {
      name: t('dashboard.navigation.knowledgeBase'),
      href: '/dashboard/knowledge-base',
      icon: BookOpenIcon,
    },
    {
      name: t('dashboard.navigation.agents'), icon: SparklesIcon, children: [
        { name: t('dashboard.navigation.agents'), href: '/dashboard/agents', icon: CpuChipIcon },
        { name: t('dashboard.navigation.tools'), href: '/dashboard/tools', icon: WrenchIcon },
        { name: t('dashboard.navigation.mediaLibrary'), href: '/dashboard/media', icon: FolderIcon },
      ]
    },
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
          name: t('dashboard.navigation.queries'),
          href: '/dashboard/logs/queries',
          icon: MagnifyingGlassIcon,
        },
        {
          name: t('dashboard.navigation.usageHistory'),
          href: '/dashboard/logs/usage',
          icon: DocumentTextIcon,
        },
      ],
    },
    {
      name: t('dashboard.navigation.apiKeys'),
      href: '/dashboard/api-keys',
      icon: KeyIcon,
      separator: true,
    },
    { name: t('dashboard.navigation.usage'), href: '/dashboard/usage', icon: ChartBarIcon },
    { name: t('dashboard.navigation.settings'), href: '/dashboard/settings', icon: Cog6ToothIcon },
    {
      name: t('dashboard.navigation.apiReference'),
      href: '/dashboard/api-reference',
      icon: DocumentTextIcon,
    },
    ...(user?.is_superuser
      ? [
        {
          name: t('dashboard.navigation.adminPanel'),
          href: '/manager',
          icon: ServerIcon,
        },
      ]
      : []),
  ];

  // Footer content
  const sidebarFooter = (
    <div className="space-y-3">
      <div className="px-2">
        <GitHubStars owner="watercrawl" repo="watercrawl" />
      </div>
      <div className="text-center text-xs text-muted-foreground">
        {t('common.version')}: <b>{settings?.api_version}</b>
        <p className="pt-2 text-xs leading-6 text-muted-foreground">
          &copy;{new Date().getFullYear()} - Made with ❤️ by{' '}
          <a
            href="https://watercrawl.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <b>WaterCrawl</b>
          </a>
        </p>
      </div>
    </div>
  );

  return (
    <div>
      {/* Privacy and Terms confirmation Modal */}
      <PrivacyTermsModal show={showPrivacyTermsModal} />

      {/* Subscription Modal */}
      <PlansModal
        show={!showPrivacyTermsModal && showSubscriptionBanner}
        showEnterprisePlan={false}
      />

      {/* Mobile Sidebar */}
      <MobileSidebarContainer isOpen={sidebarOpen} onClose={closeSidebar}>
        <Sidebar
          logo={!isDark ? '/logo.svg' : '/logo-dark.svg'}
          logoAlt="WaterCrawl"
          title="WaterCrawl"
          titleLink="/dashboard"
          navigation={navigation}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
          isMobile={true}
          expandedMenus={expandedMenus}
          onToggleMenu={toggleMenu}
          isMenuActive={isMenuActive}
          footer={sidebarFooter}
        />
      </MobileSidebarContainer>

      {/* Desktop Sidebar */}
      <DesktopSidebarContainer>
        <Sidebar
          logo={!isDark ? '/logo.svg' : '/logo-dark.svg'}
          logoAlt="WaterCrawl"
          title="WaterCrawl"
          titleLink="/dashboard"
          navigation={navigation}
          expandedMenus={expandedMenus}
          onToggleMenu={toggleMenu}
          isMenuActive={isMenuActive}
          footer={sidebarFooter}
        />
      </DesktopSidebarContainer>

      {/* Main Content */}
      <div className="flex min-h-screen flex-col lg:ps-64">
        <main className="flex-1 bg-background">
          {/* Top Header */}
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

          {/* Breadcrumbs */}
          <div className="">
            <Breadcrumbs />
          </div>

          {/* Page Content */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};
