import { Fragment, useCallback, useEffect, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { profileApi } from '../../services/api/profile';
import { useTeam } from '../../contexts/TeamContext';
import { Invitation } from '../../types/user';
import Loading from './Loading';

interface NotificationItem {
  id: string;
  type: 'invitation' | 'system'; // Extensible for future types
  title: string;
  message: string;
  timestamp: string;
  data?: any;
}

export default function NotificationBell() {
  const { t } = useTranslation();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { refreshTeams } = useTeam();

  const loadInvitations = useCallback(async () => {
    try {
      const data = await profileApi.getInvitations();
      setInvitations(data);
    } catch (error: any) {
      console.error('Failed to load invitations:', error);
    }
  }, []);

  useEffect(() => {
    loadInvitations();
    
    // Poll for new invitations every 60 seconds
    const interval = setInterval(loadInvitations, 60000);
    return () => clearInterval(interval);
  }, [loadInvitations]);

  const handleAcceptInvitation = async (uuid: string) => {
    setProcessingId(uuid);
    try {
      await profileApi.acceptInvitation(uuid);
      await refreshTeams();
      toast.success(t('profile.invitations.acceptSuccess'));
      await loadInvitations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('profile.invitations.acceptError'));
    } finally {
      setProcessingId(null);
    }
  };

  // Transform invitations to notification items
  const notifications: NotificationItem[] = invitations.map(invitation => ({
    id: invitation.uuid,
    type: 'invitation',
    title: t('notifications.invitation.title'),
    message: t('notifications.invitation.message', { teamName: invitation.team.name }),
    timestamp: invitation.created_at,
    data: invitation,
  }));

  const unreadCount = notifications.length;

  return (
    <Menu as="div" className="relative inline-block text-start">
      <Menu.Button className="relative rounded-full p-1 text-muted-foreground hover:text-foreground">
        <span className="sr-only">{t('notifications.openMenu')}</span>
        <BellIcon className="h-6 w-6" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
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
        <Menu.Items className="absolute end-0 z-10 mt-2 w-96 origin-top-end rounded-md bg-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t('notifications.title')}
            </h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <BellIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('notifications.noNotifications')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map(notification => (
                  <Menu.Item key={notification.id}>
                    {({ active }) => (
                      <div
                        className={`px-4 py-3 ${
                          active ? 'bg-muted' : ''
                        }`}
                      >
                        {notification.type === 'invitation' && (
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-x-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                  {notification.title}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {notification.message}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {format(new Date(notification.timestamp), 'PPp')}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-x-2">
                              <button
                                onClick={() => handleAcceptInvitation(notification.id)}
                                disabled={processingId === notification.id}
                                className="inline-flex items-center rounded border border-transparent bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                              >
                                {processingId === notification.id ? (
                                  <Loading size="sm" />
                                ) : (
                                  t('profile.invitations.acceptButton')
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Menu.Item>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2 text-center">
              <a
                href="/dashboard/profile"
                className="text-sm font-medium text-primary hover:text-primary-dark"
              >
                {t('notifications.viewAll')}
              </a>
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
