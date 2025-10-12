import { useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Loading from '../shared/Loading';
import { TeamInvitation, teamApi } from '../../services/api/team';
import { EnvelopeIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface TeamInvitationsListRef {
  reloadInvitations: () => Promise<void>;
}

export const TeamInvitationsList = forwardRef<TeamInvitationsListRef>((_, ref) => {
  const { t } = useTranslation();
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInvitations = useCallback(async () => {
    try {
      const data = await teamApi.getInvitations();
      setInvitations(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('settings.teamInvitations.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useImperativeHandle(ref, () => ({
    reloadInvitations: loadInvitations
  }));

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loading size="lg" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {t('settings.teamInvitations.noPending')}
      </div>
    );
  }

  return (
    <div className="mt-2 ring-1 ring-gray-300 dark:ring-gray-700 rounded-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            <th scope="col" className="py-3.5 ps-4 pe-3 text-start text-sm font-semibold text-gray-900 dark:text-white sm:ps-6">
              {t('settings.teamInvitations.invitedUser')}
            </th>
            <th scope="col" className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-white">
              {t('settings.teamInvitations.status')}
            </th>
            <th scope="col" className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-white">
              {t('settings.teamInvitations.date')}
            </th>
            <th scope="col" className="relative py-3.5 ps-3 pe-4 sm:pe-6">
              <span className="sr-only">{t('settings.proxy.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {invitations.map((invitation) => (
            <tr key={invitation.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
              <td className="whitespace-nowrap py-4 ps-4 pe-3 sm:ps-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <EnvelopeIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="ms-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {invitation.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  {t('settings.teamInvitations.pending')}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(invitation.created_at), 'PPpp')}
              </td>
              <td className="relative whitespace-nowrap py-4 ps-3 pe-4 text-end text-sm font-medium sm:pe-6">
                <button
                  onClick={() => {
                    // TODO: Add cancel invitation functionality
                    toast.error(t('settings.teamInvitations.cancelTooltip'));
                  }}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
