import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import { AxiosError } from 'axios';

import subscriptionApi from '../services/api/subscription';
import { teamApi } from '../services/api/team';
import { TeamService } from '../services/teamService';
import { CurrentSubscription } from '../types/subscription';
import { Team } from '../types/team';


interface TeamContextType {
  currentTeam: Team | null;
  teams: Team[];
  loading: boolean;
  error: Error | null;
  setCurrentTeam: (team: Team) => Promise<void>;
  refreshTeams: () => Promise<void>;
  createTeam: (name: string) => Promise<Team>;
  currentSubscription: CurrentSubscription | null;
  refreshCurrentSubscription: () => Promise<void>;
  showSubscriptionBanner: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTeam, setCurrentTeamState] = useState<Team | null>(null);
  const [showSubscriptionBanner, setShowSubscriptionBanner] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshTeams = async () => {
    try {
      setLoading(true);
      const [currentTeamResponse, teamsResponse] = await Promise.all([
        teamApi.getCurrentTeam(),
        teamApi.listTeams(),
      ]);
      setCurrentTeamState(currentTeamResponse);
      setTeams(teamsResponse);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrentSubscription = useCallback(async () => {
    try {
      setShowSubscriptionBanner(false);
      const data = await subscriptionApi.currentSubscription();
      setCurrentSubscription(data);
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 404 || err.response?.status === 403) {
          setCurrentSubscription(null);
          setShowSubscriptionBanner(true);
        }
      }
      setError(err as Error);
    }
  }, []);

  const setCurrentTeam = async (team: Team) => {
    try {
      setCurrentTeamState(team);
      TeamService.getInstance().setCurrentTeam(team);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const createTeam = async (name: string) => {
    try {
      const data = await teamApi.createTeam(name);
      await refreshTeams();
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  useEffect(() => {
    refreshTeams();
  }, []);

  useEffect(() => {
    if (!currentTeam) return;
    setCurrentSubscription(null);
    setShowSubscriptionBanner(false);
    refreshCurrentSubscription();
  }, [currentTeam, refreshCurrentSubscription]);

  return (
    <TeamContext.Provider
      value={{
        currentTeam,
        teams,
        loading,
        error,
        setCurrentTeam,
        refreshTeams,
        createTeam,
        currentSubscription,
        refreshCurrentSubscription,
        showSubscriptionBanner,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};
