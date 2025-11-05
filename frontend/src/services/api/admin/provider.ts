import api from '../api';

import {
  AdminEmbeddingModel,
  AdminEmbeddingModelRequest,
  AdminLLMModel,
  AdminLLMModelRequest,
  AdminProvider,
  AdminProviderConfig,
  AdminProviderConfigRequest,
} from '../../../types/admin/provider';
import { PaginatedResponse } from '../../../types/common';

export const adminProviderApi = {
  providerConfiguration: {
    async list(page?: number, pageSize?: number): Promise<PaginatedResponse<AdminProviderConfig>> {
      return api
        .get<PaginatedResponse<AdminProviderConfig>>('/api/v1/admin/llm/provider-configs/', {
          params: {
            page,
            page_size: pageSize,
          },
        })
        .then(({ data }) => data);
    },
    async get(uuid: string): Promise<AdminProviderConfig> {
      return api
        .get<AdminProviderConfig>(`/api/v1/admin/llm/provider-configs/${uuid}/`)
        .then(({ data }) => data);
    },
    async create(data: AdminProviderConfigRequest): Promise<AdminProviderConfig> {
      return api
        .post<AdminProviderConfig>('/api/v1/admin/llm/provider-configs/', data)
        .then(({ data }) => data);
    },
    async update(uuid: string, data: AdminProviderConfigRequest): Promise<AdminProviderConfig> {
      return api
        .patch<AdminProviderConfig>(`/api/v1/admin/llm/provider-configs/${uuid}/`, data)
        .then(({ data }) => data);
    },
    async delete(uuid: string): Promise<void> {
      await api.delete(`/api/v1/admin/llm/provider-configs/${uuid}/`);
    },
    async sync_llm_models(uuid: string): Promise<void> {
      await api.post(`/api/v1/admin/llm/provider-configs/${uuid}/sync-llm-models/`);
    },
    async sync_provider_embeddings(uuid: string): Promise<void> {
      await api.post(`/api/v1/admin/llm/provider-configs/${uuid}/sync-embeddings/`);
    },
    async providers(): Promise<AdminProvider[]> {
      return api.get<AdminProvider[]>('/api/v1/admin/llm/providers/').then(({ data }) => data);
    },
    async testProviderConfig(data: AdminProviderConfigRequest): Promise<void> {
      await api.post(`/api/v1/admin/llm/provider-configs/test-config/`, data);
    },
  },
  llmModel: {
    async list(
      page?: number,
      pageSize?: number,
      providerName?: string
    ): Promise<PaginatedResponse<AdminLLMModel>> {
      return api
        .get<PaginatedResponse<AdminLLMModel>>('/api/v1/admin/llm/llm-models/', {
          params: {
            page,
            page_size: pageSize,
            provider_name: providerName,
          },
        })
        .then(({ data }) => data);
    },
    async get(uuid: string): Promise<AdminLLMModel> {
      return api
        .get<AdminLLMModel>(`/api/v1/admin/llm/llm-models/${uuid}/`)
        .then(({ data }) => data);
    },
    async create(data: AdminLLMModelRequest): Promise<AdminLLMModel> {
      return api
        .post<AdminLLMModel>('/api/v1/admin/llm/llm-models/', data)
        .then(({ data }) => data);
    },
    async update(uuid: string, data: AdminLLMModelRequest): Promise<AdminLLMModel> {
      return api
        .patch<AdminLLMModel>(`/api/v1/admin/llm/llm-models/${uuid}/`, data)
        .then(({ data }) => data);
    },
    async delete(uuid: string): Promise<void> {
      await api.delete(`/api/v1/admin/llm/llm-models/${uuid}/`);
    },
  },
  embeddingModel: {
    async list(
      page?: number,
      pageSize?: number,
      providerName?: string
    ): Promise<PaginatedResponse<AdminEmbeddingModel>> {
      return api
        .get<PaginatedResponse<AdminEmbeddingModel>>('/api/v1/admin/llm/embedding-models/', {
          params: {
            page,
            page_size: pageSize,
            provider_name: providerName,
          },
        })
        .then(({ data }) => data);
    },
    async get(uuid: string): Promise<AdminEmbeddingModel> {
      return api
        .get<AdminEmbeddingModel>(`/api/v1/admin/llm/embedding-models/${uuid}/`)
        .then(({ data }) => data);
    },
    async create(data: AdminEmbeddingModelRequest): Promise<AdminEmbeddingModel> {
      return api
        .post<AdminEmbeddingModel>('/api/v1/admin/llm/embedding-models/', data)
        .then(({ data }) => data);
    },
    async update(uuid: string, data: AdminEmbeddingModelRequest): Promise<AdminEmbeddingModel> {
      return api
        .patch<AdminEmbeddingModel>(`/api/v1/admin/llm/embedding-models/${uuid}/`, data)
        .then(({ data }) => data);
    },
    async delete(uuid: string): Promise<void> {
      await api.delete(`/api/v1/admin/llm/embedding-models/${uuid}/`);
    },
  },
};
