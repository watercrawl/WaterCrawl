import { Fragment, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Menu, Transition } from '@headlessui/react';
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

import { useTheme } from '../../contexts/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { AuthService } from '../../services/authService';

import { AboutModal } from './AboutModal';

// Generate color based on string
const generateColorFromString = (str: string): string => {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Get initials from user
const getInitials = (firstName?: string, lastName?: string, email?: string): string => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return 'U';
};

export const ProfileMenu: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const [showAboutModal, setShowAboutModal] = useState(false);

  const handleLogout = () => {
    AuthService.logout();
  };

  const initials = getInitials(user?.first_name, user?.last_name, user?.email);
  const colorClass = generateColorFromString(user?.email || 'default');

  const themeOptions = [
    { value: 'light', label: t('common.theme.light'), icon: SunIcon },
    { value: 'dark', label: t('common.theme.dark'), icon: MoonIcon },
    { value: 'system', label: t('common.theme.system'), icon: ComputerDesktopIcon },
  ];

  return (
    <>
      <Menu as="div" className="relative">
        <Menu.Button className="flex items-center rounded-full">
          <span className="sr-only">{t('common.openUserMenu')}</span>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${colorClass}`}
          >
            {initials}
          </div>
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="origin-top-end absolute end-0 z-50 mt-2 w-72 rounded-md bg-card shadow-lg ring-1 ring-border focus:outline-none">
            {/* User Info Section */}
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.email}
              </p>
              {user?.first_name && user?.last_name && (
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              )}
            </div>

            {/* Profile Link */}
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/dashboard/profile"
                    className={`flex items-center gap-x-3 px-4 py-2 text-sm ${
                      active ? 'bg-muted text-foreground' : 'text-foreground'
                    }`}
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    {t('common.profile')}
                  </Link>
                )}
              </Menu.Item>
            </div>

            {/* Theme Selector */}
            <div className="border-t border-border py-1">
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                {t('common.theme.title')}
              </div>
              {themeOptions.map(option => (
                <Menu.Item key={option.value}>
                  {({ active }) => (
                    <button
                      onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                      className={`flex w-full items-center gap-x-3 px-4 py-2 text-sm ${
                        active ? 'bg-muted text-foreground' : 'text-foreground'
                      } ${theme === option.value ? 'font-semibold' : ''}`}
                    >
                      <option.icon className="h-5 w-5" />
                      {option.label}
                      {theme === option.value && <span className="ms-auto text-primary">✓</span>}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>

            {/* About WaterCrawl */}
            <div className="border-t border-border py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setShowAboutModal(true)}
                    className={`flex w-full items-center gap-x-3 px-4 py-2 text-sm ${
                      active ? 'bg-muted text-foreground' : 'text-foreground'
                    }`}
                  >
                    <InformationCircleIcon className="h-5 w-5" />
                    {t('common.aboutWaterCrawl')}
                  </button>
                )}
              </Menu.Item>
            </div>

            {/* Logout */}
            <div className="border-t border-border py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleLogout}
                    className={`flex w-full items-center gap-x-3 px-4 py-2 text-sm ${
                      active ? 'bg-muted text-error' : 'text-error'
                    }`}
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    {t('common.logout')}
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />
    </>
  );
};
