import { PaginatedResponse } from '../../types/common';
import { Team, TeamMember, TeamInvitation, TeamInvitationURL } from '../../types/team';
import api from './api';



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

  async revokeInvitation(invitationId: string): Promise<void> {
    return api.delete(`/api/v1/user/teams/current/invitations/${invitationId}/`);
  },

  async getInvitationURL(invitationId: string): Promise<TeamInvitationURL> {
    return api.get<TeamInvitationURL>(`/api/v1/user/teams/current/invitations/${invitationId}/url/`).then(({ data }) => data);
  },

  async resendInvitationEmail(invitationId: string): Promise<void> {
    return api.post(`/api/v1/user/teams/current/invitations/${invitationId}/resend/`);
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
