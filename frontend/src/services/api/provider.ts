import { PaginatedResponse } from '../../types/common';
import {
  ListProviderConfig,
  Provider,
  ProviderConfig,
  ProviderConfigFormData,
} from '../../types/provider';
import api from './api';

export const providerApi = {
  // Provider endpoints
  async listProviders(page?: number, pageSize?: number) {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('page_size', pageSize.toString());

    return api.get<Provider[]>('/api/v1/llm/provider-configs/providers/', { params })
      .then(({ data }) => data);
  },


  // Provider Config endpoints
  async listProviderConfigs(page?: number, pageSize?: number) {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('page_size', pageSize.toString());

    return api.get<PaginatedResponse<ProviderConfig>>('/api/v1/llm/provider-configs/', { params })
      .then(({ data }) => data);
  },

  async listAllProviderConfigs(page?: number, pageSize?: number) {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('page_size', pageSize.toString());

    return api.get<ListProviderConfig[]>('/api/v1/llm/provider-configs/list-all/', { params })
      .then(({ data }) => data);
  },

  async getProviderConfig(id: string) {
    return api.get<ProviderConfig>(`/api/v1/llm/provider-configs/${id}/`)
      .then(({ data }) => data);
  },

  async createProviderConfig(data: ProviderConfigFormData) {
    return api.post<ProviderConfig>('/api/v1/llm/provider-configs/', data)
      .then(({ data }) => data);
  },

  async updateProviderConfig(id: string, data: Partial<ProviderConfigFormData>) {
    return api.patch<ProviderConfig>(`/api/v1/llm/provider-configs/${id}/`, data)
      .then(({ data }) => data);
  },

  async deleteProviderConfig(id: string) {
    return api.delete(`/api/v1/llm/provider-configs/${id}/`);
  },

  async testProviderConfig(data: ProviderConfigFormData) {
    return api.post<{ success: boolean; message: string }>('/api/v1/llm/provider-configs/test-config/', data)
      .then(({ data }) => data);
  }
};

export default providerApi;
