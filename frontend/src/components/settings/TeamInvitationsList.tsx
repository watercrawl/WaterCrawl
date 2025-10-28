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
    reloadInvitations: loadInvitations,
  }));

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">{t('settings.teamInvitations.noPending')}</div>
    );
  }

  return (
    <div className="mt-2 overflow-hidden rounded-md ring-1 ring-border">
      <table className="min-w-full divide-y divide-border">
        <thead>
          <tr className="bg-muted">
            <th
              scope="col"
              className="py-3.5 pe-3 ps-4 text-start text-sm font-semibold text-foreground sm:ps-6"
            >
              {t('settings.teamInvitations.invitedUser')}
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
            >
              {t('settings.teamInvitations.status')}
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-start text-sm font-semibold text-foreground"
            >
              {t('settings.teamInvitations.date')}
            </th>
            <th scope="col" className="relative py-3.5 pe-4 ps-3 sm:pe-6">
              <span className="sr-only">{t('settings.proxy.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {invitations.map(invitation => (
            <tr key={invitation.uuid} className="transition-colors duration-200 hover:bg-muted">
              <td className="whitespace-nowrap py-4 pe-3 ps-4 sm:ps-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <EnvelopeIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="ms-4">
                    <div className="text-sm font-medium text-foreground">{invitation.email}</div>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className="inline-flex items-center rounded-md bg-warning-light px-2.5 py-0.5 text-xs font-medium text-warning-dark">
                  {t('settings.teamInvitations.pending')}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                {format(new Date(invitation.created_at), 'PPpp')}
              </td>
              <td className="relative whitespace-nowrap py-4 pe-4 ps-3 text-end text-sm font-medium sm:pe-6">
                <button
                  onClick={() => {
                    // TODO: Add cancel invitation functionality
                    toast.error(t('settings.teamInvitations.cancelTooltip'));
                  }}
                  className="rounded-md text-muted-foreground hover:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
