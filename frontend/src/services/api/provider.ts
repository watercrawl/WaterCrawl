import { PaginatedResponse } from '../../types/common';
import {
  CreateCustomModelRequest,
  ListProviderConfig,
  Provider,
  ProviderConfig,
  ProviderConfigDetail,
  ProviderConfigFormData,
  ProviderConfigModel,
  SetModelStatusRequest,
  UpdateCustomModelRequest,
} from '../../types/provider';

import api from './api';

export const providerApi = {
  // Provider endpoints
  async listProviders(page?: number, pageSize?: number) {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('page_size', pageSize.toString());

    return api
      .get<Provider[]>('/api/v1/llm/provider-configs/providers/', { params })
      .then(({ data }) => data);
  },

  // Provider Config endpoints
  async listProviderConfigs(page?: number, pageSize?: number) {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('page_size', pageSize.toString());

    return api
      .get<PaginatedResponse<ProviderConfig>>('/api/v1/llm/provider-configs/', { params })
      .then(({ data }) => data);
  },

  async listAllProviderConfigs(page?: number, pageSize?: number) {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('page_size', pageSize.toString());

    return api
      .get<ListProviderConfig[]>('/api/v1/llm/provider-configs/list-all/', { params })
      .then(({ data }) => data);
  },

  async getProviderConfig(id: string) {
    return api.get<ProviderConfig>(`/api/v1/llm/provider-configs/${id}/`).then(({ data }) => data);
  },

  async createProviderConfig(data: ProviderConfigFormData) {
    return api.post<ProviderConfig>('/api/v1/llm/provider-configs/', data).then(({ data }) => data);
  },

  async updateProviderConfig(id: string, data: Partial<ProviderConfigFormData>) {
    return api
      .patch<ProviderConfig>(`/api/v1/llm/provider-configs/${id}/`, data)
      .then(({ data }) => data);
  },

  async deleteProviderConfig(id: string) {
    return api.delete(`/api/v1/llm/provider-configs/${id}/`);
  },

  async testProviderConfig(data: ProviderConfigFormData) {
    return api
      .post<{
        success: boolean;
        message: string;
      }>('/api/v1/llm/provider-configs/test-config/', data)
      .then(({ data }) => data);
  },

  // Model management endpoints (nested under provider-configs/{id}/models/)
  async getProviderConfigModels(providerConfigId: string) {
    return api
      .get<ProviderConfigDetail>(`/api/v1/llm/provider-configs/${providerConfigId}/models/`)
      .then(({ data }) => data);
  },

  async setModelStatus(providerConfigId: string, data: SetModelStatusRequest) {
    return api
      .post<ProviderConfigModel>(
        `/api/v1/llm/provider-configs/${providerConfigId}/models/set-status/`,
        data
      )
      .then(({ data }) => data);
  },

  async createCustomModel(providerConfigId: string, data: CreateCustomModelRequest) {
    return api
      .post<ProviderConfigModel>(
        `/api/v1/llm/provider-configs/${providerConfigId}/models/`,
        data
      )
      .then(({ data }) => data);
  },

  async updateCustomModel(
    providerConfigId: string,
    modelUuid: string,
    data: UpdateCustomModelRequest
  ) {
    return api
      .patch<ProviderConfigModel>(
        `/api/v1/llm/provider-configs/${providerConfigId}/models/${modelUuid}/`,
        data
      )
      .then(({ data }) => data);
  },

  async deleteCustomModel(providerConfigId: string, modelUuid: string) {
    return api.delete(
      `/api/v1/llm/provider-configs/${providerConfigId}/models/${modelUuid}/`
    );
  },
};

export default providerApi;
