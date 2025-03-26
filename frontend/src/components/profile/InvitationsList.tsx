import  { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Loading from '../shared/Loading';
import { profileApi } from '../../services/api/profile';
import { useTeam } from '../../contexts/TeamContext';
import { Invitation } from '../../types/user';

export function InvitationsList() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);
  const { refreshTeams } = useTeam();

  const loadInvitations = async () => {
    try {
      const data = await profileApi.getInvitations();
      setInvitations(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const handleAccept = async (uuid: string) => {
    setProcessingInvitation(uuid);
    try {
      await profileApi.acceptInvitation(uuid);
      await refreshTeams(); // Refresh teams list after accepting invitation
      toast.success('Invitation accepted successfully');
      await loadInvitations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setProcessingInvitation(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loading size="lg" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
        No pending invitations
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <div
          key={invitation.uuid}
          className="bg-white dark:bg-gray-700 shadow rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {invitation.team.name}
            </h4>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {format(new Date(invitation.created_at), 'PPpp')}
            </p>
          </div>
          <div>
            <button
              onClick={() => handleAccept(invitation.uuid)}
              disabled={processingInvitation === invitation.uuid}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {processingInvitation === invitation.uuid ? <Loading size="sm" /> : 'Accept'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
