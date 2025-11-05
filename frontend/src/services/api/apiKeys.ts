import { ApiKey } from '../../types/apiKeys';
import { PaginatedResponse } from '../../types/common';

import api from './api';

export const apiKeysApi = {
  async list(page: number): Promise<PaginatedResponse<ApiKey>> {
    const { data } = await api.get<PaginatedResponse<ApiKey>>('/api/v1/user/api-keys/', {
      params: { page },
    });
    return data;
  },

  async create(name: string): Promise<ApiKey> {
    const { data } = await api.post<ApiKey>('/api/v1/user/api-keys/', { name });
    return data;
  },

  async delete(pk: string): Promise<void> {
    await api.delete(`/api/v1/user/api-keys/${pk}/`);
  },
};
