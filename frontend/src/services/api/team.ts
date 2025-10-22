import { PaginatedResponse } from '../../types/common';
import { Team, TeamMember } from '../../types/team';
import api from './api';

export interface TeamInvitation {
  uuid: string;
  email: string;
  created_at: string;
}

export const teamApi = {
  async getCurrentTeam(): Promise<Team> {
    return api.get<Team>('/api/v1/user/teams/current/').then(({ data }) => data);
  },

  async listTeams(): Promise<Team[]> {
    return api.get<Team[]>('/api/v1/user/teams/').then(({ data }) => data);
  },

  async createTeam(name: string): Promise<Team> {
    return api.post<Team>('/api/v1/user/teams/', { name }).then(({ data }) => data);
  },

  async updateTeamName(name: string): Promise<Team> {
    return api.patch<Team>('/api/v1/user/teams/current/', { name }).then(({ data }) => data);
  },

  async inviteMember(email: string): Promise<void> {
    return api.post('/api/v1/user/teams/current/invite/', { email });
  },

  async listMembers(page: number = 1): Promise<PaginatedResponse<TeamMember>> {
    return api
      .get<PaginatedResponse<TeamMember>>('/api/v1/user/teams/current/members/', {
        params: { page },
      })
      .then(({ data }) => data);
  },

  async removeMember(memberId: string): Promise<void> {
    return api.delete(`/api/v1/user/teams/current/members/${memberId}/`);
  },

  async getInvitations(): Promise<TeamInvitation[]> {
    return api
      .get<TeamInvitation[]>('/api/v1/user/teams/current/invitations/')
      .then(({ data }) => data);
  },
};
