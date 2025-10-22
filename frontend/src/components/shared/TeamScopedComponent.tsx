import React from 'react';
import { useTeam } from '../../contexts/TeamContext';

interface TeamScopedComponentProps {
  children: React.ReactNode;
}

export const TeamScopedComponent: React.FC<TeamScopedComponentProps> = ({ children }) => {
  const { currentTeam } = useTeam();

  // Use the team ID as a key to force remount when team changes
  return <div key={currentTeam?.uuid}>{children}</div>;
};
