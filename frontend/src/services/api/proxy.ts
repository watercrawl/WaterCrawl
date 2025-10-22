import api from './api';
import { PaginatedResponse } from '../../types/common';
import { CreateProxyRequest, Proxy, TestProxyRequest, UsableProxy } from '../../types/proxy';

export const proxyApi = {
  async create(data: CreateProxyRequest) {
    return api.post<Proxy>('/api/v1/core/proxy-servers/', data).then(({ data }) => data);
  },
  async list(page: number = 1, page_size: number = 10) {
    return api
      .get<PaginatedResponse<Proxy>>('/api/v1/core/proxy-servers/', { params: { page, page_size } })
      .then(({ data }) => data);
  },
  async delete(slug: string) {
    return api.delete(`/api/v1/core/proxy-servers/${slug}/`);
  },
  async update(slug: string, data: CreateProxyRequest) {
    return api.patch<Proxy>(`/api/v1/core/proxy-servers/${slug}/`, data).then(({ data }) => data);
  },
  async get(slug: string) {
    return api.get<Proxy>(`/api/v1/core/proxy-servers/${slug}/`).then(({ data }) => data);
  },
  async all() {
    return api.get<UsableProxy[]>('/api/v1/core/proxy-servers/list-all/').then(({ data }) => data);
  },
  async testProxy(data: TestProxyRequest) {
    return api.post<Proxy>('/api/v1/core/proxy-servers/test-proxy/', data).then(({ data }) => data);
  },
};

export default proxyApi;
