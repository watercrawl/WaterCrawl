import { PaginatedResponse } from '../../types/common';
import { SitemapGraph } from '../../types/crawl';
import { SitemapRequest, SitemapEvent } from '../../types/sitemap';

import api from './api';

export const sitemapApi = {
  // Create a new sitemap request
  async create(request: SitemapRequest) {
    return api.post<SitemapRequest>('/api/v1/core/sitemaps/', request).then(({ data }) => data);
  },

  // Get a sitemap request by ID
  async get(id: string) {
    return api
      .get<SitemapRequest>(`/api/v1/core/sitemaps/${id}/`, {
        params: {
          prefetched: true,
        },
      })
      .then(({ data }) => data);
  },

  // List all sitemap requests with pagination
  async list(page = 1, status?: string) {
    return api
      .get<PaginatedResponse<SitemapRequest>>('/api/v1/core/sitemaps/', {
        params: {
          page,
          page_size: 10,
          status,
        },
      })
      .then(({ data }) => data);
  },

  // Subscribe to search request status updates using Server-Sent Events (SSE)
  async subscribeToStatus(uuid: string, onEvent: (data: SitemapEvent) => void, onEnd?: () => void) {
    return api.subscribeToSSE<SitemapEvent>(
      `/api/v1/core/sitemaps/${uuid}/status/`,
      {
        params: {
          prefetched: true,
        },
      },
      onEvent,
      onEnd
    );
  },

  // Delete/cancel a sitemap request
  async delete(id: string) {
    await api.delete(`/api/v1/core/sitemaps/${id}/`);
  },

  // Get sitemap graph
  async getGraph(uuid: string) {
    return api.get<SitemapGraph>(`/api/v1/core/sitemaps/${uuid}/graph/`).then(({ data }) => data);
  },

  // Get sitemap markdown
  async getMarkdown(uuid: string) {
    return api.get<string>(`/api/v1/core/sitemaps/${uuid}/markdown/`).then(({ data }) => data);
  },
};
