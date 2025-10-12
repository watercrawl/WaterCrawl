import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { teamApi } from '../../services/api/team';
import { UserCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Team, TeamMember } from '../../types/team';
import toast from 'react-hot-toast';
import { TeamInvitationsList, TeamInvitationsListRef } from '../../components/settings/TeamInvitationsList';
import { useTeam } from '../../contexts/TeamContext';
import { useSettings } from '../../contexts/SettingsProvider';
import { SubscriptionStatusCard } from '../../components/shared/SubscriptionStatusCard';
import { BillingManagementCard } from '../../components/shared/BillingManagementCard';
import { SubscriptionsList } from '../../components/shared/SubscriptionsList';
import ProxySettings from '../../components/settings/ProxySettings';
import ProviderConfigSettings from '../../components/settings/ProviderConfigSettings';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';
import { useTranslation } from 'react-i18next';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface ErrorResponse {
  message: string;
}

// Define tabs outside component to avoid recreation on every render
const TABS = ['#team', '#proxy', '#provider-config', '#billing'] as const;

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const invitationsListRef = useRef<TeamInvitationsListRef>(null);
  const { refreshTeams } = useTeam();
  const { settings } = useSettings();
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const { setItems } = useBreadcrumbs();
  
  // Track if we're updating tab from hash change (to prevent loops)
  const isUpdatingFromHash = useRef(false);

  useEffect(() => {
    // Check for hash on initial load
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      isUpdatingFromHash.current = true;
      
      // If no hash exists, set default to #team
      if (!hash) {
        window.location.hash = '#team';
        setSelectedTabIndex(0);
        isUpdatingFromHash.current = false;
        return;
      }
      
      // If hash exists and is valid, set the corresponding tab
      if (TABS.includes(hash as any)) {
        setSelectedTabIndex(TABS.indexOf(hash as any));
      } else {
        // If hash is invalid, default to #team
        window.location.hash = '#team';
        setSelectedTabIndex(0);
      }
      
      // Reset flag after state update
      setTimeout(() => {
        isUpdatingFromHash.current = false;
      }, 0);
    };

    // Initial check
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Cleanup listener
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Update URL hash when tab index changes (from user clicking tabs)
  useEffect(() => {
    // Skip if we're updating from a hash change (to prevent loops)
    if (isUpdatingFromHash.current) {
      return;
    }
    
    const currentHash = window.location.hash;
    const expectedHash = TABS[selectedTabIndex];
    
    // Only update hash if it's different (avoids infinite loops)
    if (currentHash !== expectedHash) {
      window.location.hash = expectedHash;
    }
  }, [selectedTabIndex]);

  // Update breadcrumbs when tab changes
  useEffect(() => {
    const breadcrumbs = [
      { label: t('dashboard.title'), href: '/dashboard'},
      { label: t('settings.title'), href: '/dashboard/settings' },
      { label: t('settings.team.tab'), href: `/dashboard/settings${TABS[selectedTabIndex]}`, current: true },
    ];
    
    // Update breadcrumb label based on selected tab
    if (selectedTabIndex === 1) {
      breadcrumbs[2].label = t('settings.team.proxyTab');
    } else if (selectedTabIndex === 2) {
      breadcrumbs[2].label = t('settings.team.providerTab');
    } else if (selectedTabIndex === 3) {
      breadcrumbs[2].label = t('settings.team.billingTab');
    } else {
      breadcrumbs[2].label = t('settings.team.tab');
    }
    
    setItems(breadcrumbs);
  }, [selectedTabIndex, t, setItems]);

  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true);
      const data = await teamApi.getCurrentTeam();
      setTeam(data);
      setNewTeamName(data.name);
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await teamApi.listMembers(currentPage);
      setMembers(data.results);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  useEffect(() => {
    fetchMembers();
  }, [currentPage, fetchMembers]);


  const handleUpdateTeamName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !newTeamName.trim()) return;

    try {
      setLoading(true);
      const updatedTeam = await teamApi.updateTeamName(newTeamName);
      setTeam(updatedTeam);
      setEditingName(false);
      await refreshTeams(); // Refresh teams list in context
      toast.success(t('settings.team.nameUpdateSuccess'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('settings.team.nameUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    setLoading(true);
    teamApi
      .inviteMember(newMemberEmail)
      .then(() => {
        fetchMembers(); // Refresh members list
        setNewMemberEmail('');
        toast.success(t('settings.team.memberInviteSuccess'));
        invitationsListRef.current?.reloadInvitations();
      })
      .catch((error) => {
        if (error.response?.status === 400) {
          const errorData = error.response.data as ErrorResponse;
          toast.error(errorData.message);
        } else {
          toast.error(t('settings.team.memberInviteError'));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm(t('settings.team.confirmRemove'))) return;

    try {
      setLoading(true);
      await teamApi.removeMember(memberId);
      await Promise.all([
        fetchMembers(), // Refresh members list
        refreshTeams(), // Refresh teams in context
      ]);
      toast.success(t('settings.team.memberRemoveSuccess'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('settings.team.memberRemoveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full">
      <div className="px-8 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('settings.team.subtitle')}</p>

        <TabGroup selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
          <TabList className="flex gap-x-1 mt-8 border-b border-gray-200 dark:border-gray-700">
            <Tab
              className={({ selected }: { selected: boolean }) =>
                classNames(
                  'px-4 py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                  'focus:outline-none',
                  selected
                    ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                )
              }
            >
              {t('settings.team.tab')}
            </Tab>
            <Tab
              className={({ selected }: { selected: boolean }) =>
                classNames(
                  'px-4 py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                  'focus:outline-none',
                  selected
                    ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                )
              }
            >
              {t('settings.team.proxyTab')}
            </Tab>
            <Tab
              className={({ selected }: { selected: boolean }) =>
                classNames(
                  'px-4 py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                  'focus:outline-none',
                  selected
                    ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                )
              }
            >
              {t('settings.team.providerTab')}
            </Tab>
            {settings?.is_enterprise_mode_active && (
              <Tab
                className={({ selected }: { selected: boolean }) =>
                  classNames(
                    'px-4 py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                    'focus:outline-none',
                    selected
                      ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  )
                }
              >
                {t('settings.team.billingTab')}
              </Tab>
            )}
          </TabList>

          <TabPanels className="mt-8">
            <TabPanel className="space-y-8">
              {/* Team Name Section */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">{t('settings.team.name')}</h3>
                <div className="flex items-center gap-x-4">
                  <input
                    type="text"
                    value={editingName ? newTeamName : team?.name}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    onClick={() => !editingName && setEditingName(true)}
                    className="max-w-md h-10 px-3 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-gray-500 focus:ring-gray-500 dark:focus:border-gray-400 dark:focus:ring-gray-400"
                    disabled={loading}
                  />
                  {editingName && (
                    <button
                      onClick={handleUpdateTeamName}
                      disabled={loading}
                      className="inline-flex items-center h-10 px-4 text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors duration-200"
                    >
                      {t('settings.team.save')}
                    </button>
                  )}
                </div>
              </div>

              {/* Invite Member Section */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">{t('settings.team.inviteMemberTitle')}</h3>
                <form onSubmit={handleInviteMember} className="mt-6">
                  <div className="flex items-center gap-x-4">
                    <input
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder={t('settings.team.emailPlaceholder')}
                      className="max-w-md h-10 px-3 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:border-gray-500 focus:ring-gray-500 dark:focus:border-gray-400 dark:focus:ring-gray-400 dark:placeholder-gray-400"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center h-10 px-4 text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors duration-200"
                    >
                      {t('settings.team.invite')}
                    </button>
                  </div>
                </form>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('settings.team.pendingInvitations')}</h4>
                  <TeamInvitationsList ref={invitationsListRef} />
                </div>
              </div>

              {/* Team Members Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">{t('settings.team.members')}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('settings.team.subtitle2')}
                    </p>
                  </div>
                </div>

                <div className="mt-2 ring-1 ring-gray-300 dark:ring-gray-700 rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <th scope="col" className="py-3.5 ps-4 pe-3 text-start text-sm font-semibold text-gray-900 dark:text-white sm:ps-6">
                          {t('settings.team.memberColumn')}
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-start text-sm font-semibold text-gray-900 dark:text-white">
                          {t('settings.team.roleColumn')}
                        </th>
                        <th scope="col" className="relative py-3.5 ps-3 pe-4 sm:pe-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {members.map((member) => (
                        <tr key={member.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                          <td className="whitespace-nowrap py-4 ps-4 pe-3 sm:ps-6">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                              </div>
                              <div className="ms-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {member.user.full_name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{member.user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium capitalize bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                              {member.is_owner ? t('settings.team.owner') : t('settings.team.member')}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 ps-3 pe-4 text-end text-sm font-medium sm:pe-6">
                            {!member.is_owner && (
                              <button
                                onClick={() => handleRemoveMember(member.uuid)}
                                disabled={loading}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 sm:px-6">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {t('settings.team.showingPage')} <span className="font-medium">{currentPage}</span> {t('settings.team.of')}{' '}
                          <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div className="flex gap-x-2">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1 || loading}
                          className="inline-flex items-center h-10 px-4 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors duration-200"
                        >
                          {t('common.previous')}
                        </button>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages || loading}
                          className="inline-flex items-center h-10 px-4 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors duration-200"
                        >
                          {t('common.next')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              <ProxySettings />
            </TabPanel>
            <TabPanel>
              <ProviderConfigSettings />
            </TabPanel>
            {settings?.is_enterprise_mode_active && (
              <TabPanel>
                <div className="space-y-6">
                  <SubscriptionStatusCard />
                  <BillingManagementCard />
                  <SubscriptionsList />
                </div>
              </TabPanel>
            )}
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
};

export default SettingsPage;
