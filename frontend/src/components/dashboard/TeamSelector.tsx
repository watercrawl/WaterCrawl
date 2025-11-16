import React, { Fragment, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { Menu, Transition, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { ChevronDownIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/20/solid';

import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';

import { useTeam } from '../../contexts/TeamContext';
import { classnames } from '../../lib/utils';

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

      <Modal
        isOpen={isCreateTeamOpen}
        onClose={() => setIsCreateTeamOpen(false)}
        title={t('team.createNewTeam')}
        icon={UserGroupIcon}
        size="md"
        footer={
          <>
            <button
              type="button"
              className="inline-flex justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={() => setIsCreateTeamOpen(false)}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="inline-flex justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={handleCreateTeam}
            >
              {t('common.create')}
            </button>
          </>
        }
      >
        <Input
          type="text"
          value={newTeamName}
          onChange={e => setNewTeamName(e.target.value)}
          placeholder={t('team.teamNamePlaceholder')}
        />
      </Modal>
    </>
  );
};
