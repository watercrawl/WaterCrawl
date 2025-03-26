import { CrawlEvent, CrawlRequest } from '../../types/crawl';
import api from './api';

export const crawlRequestApi = {
  async createCrawlRequest(request: CrawlRequest) {
    return api.post<CrawlRequest>('/api/v1/core/crawl-requests/', request).then(({ data }) => data);
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

  async subscribeToStatus(uuid: string, onEvent: (data: CrawlEvent) => void, onEnd?: () => void) {
    const response = await api.get(`/api/v1/core/crawl-requests/${uuid}/status/`, {
      responseType: 'stream',
      onDownloadProgress: (progressEvent) => {
        const chunk = progressEvent.event.target.response;
        if (!chunk) return;

        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6);
              const data = JSON.parse(jsonStr);
              onEvent(data);
            } catch (error) {
              console.error('Error parsing SSE data:', error);
            }
          }
        }
      }
    });

    if (onEnd) {
      onEnd();
    }

    return response.data;
  },
};
