import { useCallback, useEffect, useState } from 'react';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { format } from 'date-fns';

import Loading from '../shared/Loading';

import { useTeam } from '../../contexts/TeamContext';
import { profileApi } from '../../services/api/profile';
import { Invitation } from '../../types/user';

export function InvitationsList() {
  const { t } = useTranslation();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);
  const { refreshTeams } = useTeam();

  const loadInvitations = useCallback(async () => {
    try {
      const data = await profileApi.getInvitations();
      setInvitations(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('profile.invitations.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleAccept = async (uuid: string) => {
    setProcessingInvitation(uuid);
    try {
      await profileApi.acceptInvitation(uuid);
      await refreshTeams(); // Refresh teams list after accepting invitation
      toast.success(t('profile.invitations.acceptSuccess'));
      await loadInvitations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('profile.invitations.acceptError'));
    } finally {
      setProcessingInvitation(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="py-6 text-center text-muted-foreground">
        {t('profile.invitations.noPending')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map(invitation => (
        <div
          key={invitation.uuid}
          className="flex items-center justify-between rounded-lg bg-card p-4 shadow"
        >
          <div className="flex-1">
            <h4 className="text-sm font-medium text-foreground">{invitation.team.name}</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              {format(new Date(invitation.created_at), 'PPpp')}
            </p>
          </div>
          <div>
            <button
              onClick={() => handleAccept(invitation.uuid)}
              disabled={processingInvitation === invitation.uuid}
              className="inline-flex items-center rounded border border-transparent bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              {processingInvitation === invitation.uuid ? (
                <Loading size="sm" />
              ) : (
                t('profile.invitations.acceptButton')
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
