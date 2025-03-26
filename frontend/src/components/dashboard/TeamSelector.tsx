import React, { Fragment, useState } from 'react';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/20/solid';
import { classNames } from '../../utils/classNames';
import { useTeam } from '../../contexts/TeamContext';

export const TeamSelector: React.FC = () => {
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
        <Menu.Button className="flex items-center gap-x-1 text-sm font-medium leading-6 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1 hover:border-gray-300 dark:hover:border-gray-600">
          {currentTeam.name}
          <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
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
          <Menu.Items className="absolute left-0 z-10 mt-2.5 w-48 origin-top-left rounded-md bg-white dark:bg-gray-800 py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
            {teams.map((team) => (
              <Menu.Item key={team.uuid}>
                {({ active }) => (
                  <button
                    onClick={() => setCurrentTeam(team)}
                    className={classNames(
                      active ? 'bg-gray-50 dark:bg-gray-700' : '',
                      'block px-3 py-1 w-full text-left text-sm leading-6 text-gray-900 dark:text-white'
                    )}
                  >
                    {team.name}
                  </button>
                )}
              </Menu.Item>
            ))}
            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => setIsCreateTeamOpen(true)}
                  className={classNames(
                    active ? 'bg-gray-50 dark:bg-gray-700' : '',
                    'block px-3 py-1 w-full text-left text-sm leading-6 text-gray-900 dark:text-white'
                  )}
                >
                  <div className="flex items-center">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Team
                  </div>
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>

      <Transition appear show={isCreateTeamOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsCreateTeamOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 dark:bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Create New Team
                  </Dialog.Title>
                  <div className="mt-4">
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Team Name"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      onClick={() => setIsCreateTeamOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      onClick={handleCreateTeam}
                    >
                      Create
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
