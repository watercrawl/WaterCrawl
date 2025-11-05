import { BatchCrawlRequest, CrawlEvent, CrawlRequest, SitemapGraph } from '../../types/crawl';

import api from './api';

export const crawlRequestApi = {
  async createCrawlRequest(request: CrawlRequest) {
    return api.post<CrawlRequest>('/api/v1/core/crawl-requests/', request).then(({ data }) => data);
  },

  async createBatchCrawlRequest(request: BatchCrawlRequest) {
    return api
      .post<CrawlRequest>('/api/v1/core/crawl-requests/batch/', request)
      .then(({ data }) => data);
  },

  async getCrawlRequest(uuid: string) {
    return api.get<CrawlRequest>(`/api/v1/core/crawl-requests/${uuid}/`).then(({ data }) => data);
  },

  async downloadCrawlResult(id: string) {
    return api.get(`/api/v1/core/crawl-requests/${id}/download/`).then(({ data }) => data);
  },

  async cancelCrawl(id: string) {
    await api.delete(`/api/v1/core/crawl-requests/${id}/`);
  },

  async sitmapGraph(uuid: string) {
    return api
      .get<SitemapGraph>(`/api/v1/core/crawl-requests/${uuid}/sitemap/graph/`)
      .then(({ data }) => data);
  },

  async sitmapMarkdown(uuid: string) {
    return api
      .get<string>(`/api/v1/core/crawl-requests/${uuid}/sitemap/markdown/`)
      .then(({ data }) => data);
  },

  async subscribeToStatus(uuid: string, onEvent: (data: CrawlEvent) => void, onEnd?: () => void) {
    return api.subscribeToSSE<CrawlEvent>(
      `/api/v1/core/crawl-requests/${uuid}/status/`,
      {
        params: {
          prefetched: 'true',
        },
      },
      onEvent,
      onEnd
    );
  },
};
