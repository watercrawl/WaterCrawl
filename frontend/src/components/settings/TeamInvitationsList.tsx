import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Loading from '../shared/Loading';
import { TeamInvitation, teamApi } from '../../services/api/team';
import { EnvelopeIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface TeamInvitationsListRef {
  reloadInvitations: () => Promise<void>;
}

export const TeamInvitationsList = forwardRef<TeamInvitationsListRef>((_, ref) => {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInvitations = async () => {
    try {
      const data = await teamApi.getInvitations();
      setInvitations(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    reloadInvitations: loadInvitations
  }));

  useEffect(() => {
    loadInvitations();
  }, []);

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
        No pending invitations
      </div>
    );
  }

  return (
    <div className="mt-2 ring-1 ring-gray-300 dark:ring-gray-700 rounded-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
              Invited User
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Status
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Date
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {invitations.map((invitation) => (
            <tr key={invitation.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <EnvelopeIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {invitation.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Pending
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(invitation.created_at), 'PPpp')}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <button
                  onClick={() => {
                    // TODO: Add cancel invitation functionality
                    toast.error('Cancel invitation functionality coming soon...');
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
