import React, { Fragment, useState } from 'react';
import {
  Menu,
  Transition,
  Dialog,
  MenuButton,
  MenuItems,
  MenuItem,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/20/solid';
import { classnames } from '../../lib/utils';
import { useTeam } from '../../contexts/TeamContext';
import { useTranslation } from 'react-i18next';

export const TeamSelector: React.FC = () => {
  const { t } = useTranslation();
  const { currentTeam, teams, setCurrentTeam, createTeam } = useTeam();
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const handleCreateTeam = async () => {
    try {
      await createTeam(newTeamName);
      setNewTeamName('');
      setIsCreateTeamOpen(false);
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  if (!currentTeam) return null;

  return (
    <>
      <Menu as="div" className="relative">
        <MenuButton className="flex items-center gap-x-1 rounded-md border border-border px-3 py-1 text-sm font-medium leading-6 text-foreground hover:border-input-border">
          {currentTeam.name}
          <ChevronDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </MenuButton>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems
            anchor="bottom start"
            className="bg-popover z-[1001] mt-2.5 w-48 rounded-md bg-card py-2 shadow-lg ring-1 ring-border/10 focus:outline-none"
          >
            {teams.map(team => (
              <MenuItem key={team.uuid}>
                {({ active }) => (
                  <button
                    onClick={() => setCurrentTeam(team)}
                    className={classnames({
                      'block w-full px-3 py-1 text-start text-sm leading-6 text-foreground': true,
                      'bg-muted': active,
                    })}
                  >
                    {team.name}
                  </button>
                )}
              </MenuItem>
            ))}
            <div className="my-1 border-t border-border" />
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={() => setIsCreateTeamOpen(true)}
                  className={classnames({
                    'block w-full px-3 py-1 text-start text-sm leading-6 text-foreground': true,
                    'bg-muted': active,
                  })}
                >
                  <div className="flex items-center">
                    <PlusIcon className="me-2 h-4 w-4" />
                    {t('team.createTeam')}
                  </div>
                </button>
              )}
            </MenuItem>
          </MenuItems>
        </Transition>
      </Menu>

      <Transition appear show={isCreateTeamOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsCreateTeamOpen(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="bg-popover w-full max-w-md transform overflow-hidden rounded-2xl bg-card p-6 text-start align-middle shadow-xl transition-all">
                  <DialogTitle as="h3" className="text-lg font-medium leading-6 text-foreground">
                    {t('team.createNewTeam')}
                  </DialogTitle>
                  <div className="mt-4">
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={e => setNewTeamName(e.target.value)}
                      placeholder={t('team.teamNamePlaceholder')}
                      className="block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-input-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      onClick={() => setIsCreateTeamOpen(false)}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      onClick={handleCreateTeam}
                    >
                      {t('common.create')}
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
