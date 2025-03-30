import api from './api';
import { Invitation, UpdateProfileRequest, Profile } from '../../types/user';


export const profileApi = {
  async getProfile(): Promise<Profile> {
    return api.get<Profile>('/api/v1/user/profile/').then(({ data }) => data);
  },

  async updateProfile(data: UpdateProfileRequest): Promise<Profile> {
    return api.patch<Profile>('/api/v1/user/profile/', data).then(({ data }) => data);
  },

  async getInvitations(): Promise<Invitation[]> {
    return api.get<Invitation[]>('/api/v1/user/profile/invitations/').then(({ data }) => data);
  },

  async acceptInvitation(uuid: string): Promise<void> {
    return api.post(`/api/v1/user/profile/invitations/${uuid}/accept/`);
  },
};
