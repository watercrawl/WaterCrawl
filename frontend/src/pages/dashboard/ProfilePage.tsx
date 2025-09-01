import { useEffect } from 'react';
import { ProfileForm } from '../../components/profile/ProfileForm';
import { InvitationsList } from '../../components/profile/InvitationsList';
import { LogoutButton } from '../../components/profile/LogoutButton';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

export default function ProfilePage() {
  const { setItems } = useBreadcrumbs();

  useEffect(() => {
    setItems([
      { label: 'Dashboard', href: '/dashboard'},
      { label: 'Profile', href: '/dashboard/profile', current: true },
    ]);
  }, [setItems]);

  return (
    <div className="px-8 py-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Profile</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Manage your personal information and preferences.
      </p>
      <div>
        <div className="py-4">
          <ProfileForm />
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Team Invitations</h2>
          <InvitationsList />
        </div>

        <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Actions</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your account settings and preferences.
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
