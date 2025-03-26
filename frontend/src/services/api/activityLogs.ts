import { PaginatedResponse } from '../../types/common';
import { CrawlRequest, CrawlResult } from '../../types/crawl';
import api from './api';

export const activityLogsApi = {
  async listCrawlRequests(page: number, status?: string): Promise<PaginatedResponse<CrawlRequest>> {
    return api.get<PaginatedResponse<CrawlRequest>>(`/api/v1/core/crawl-requests/`, {
      params: { page, status, page_size: 10 }
    }).then(({ data }) => data);
  },

  async getCrawlRequest(requestId: string): Promise<CrawlRequest> {
    return api.get<CrawlRequest>(`/api/v1/core/crawl-requests/${requestId}/`).then(({ data }) => data);
  },

  async getCrawlResults(requestId: string, page: number = 1): Promise<PaginatedResponse<CrawlResult>> {
    return api.get<PaginatedResponse<CrawlResult>>(
      `/api/v1/core/crawl-requests/${requestId}/results/`,
      { params: { page, page_size: 25 } }
    ).then(({ data }) => data);
  },

  async downloadResults(requestId: string, format: 'json' | 'markdown'): Promise<Blob> {
    const response = await api.get(`/api/v1/core/crawl-requests/${requestId}/download/`, {
      params: { output_format: format },
      responseType: 'blob'
    });
    return response.data;
  },
};
