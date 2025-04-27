import { PaginatedResponse } from '../../types/common';
import { SearchRequest, SearchEvent } from '../../types/search';
import api from './api';

export const searchApi = {
  // Create a new search request
  async create(request: SearchRequest) {
    return api.post<SearchRequest>('/api/v1/core/search/', request).then(({ data }) => data);
  },
  
  // Get a search request by ID
  async get(id: string) {
    return api.get<SearchRequest>(`/api/v1/core/search/${id}/`,{
      params: {
        prefetched: true
      }
    }).then(({ data }) => data);
  },
  
  // List all search requests with pagination
  async list(page = 1, filters = {}) {
    return api.get<PaginatedResponse<SearchRequest>>('/api/v1/core/search/', {
      params: {
        page,
        ...filters
      }
    }).then(({ data }) => data);
  },
  
  // Subscribe to search request status updates using Server-Sent Events (SSE)
  async subscribeToStatus(uuid: string, onEvent: (data: SearchEvent) => void, onEnd?: () => void) {
    const response = await api.get(`/api/v1/core/search/${uuid}/status/`, {
      params: {
        prefetched: true
      },
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
  
  // Delete/cancel a search request
  async delete(id: string) {
    await api.delete(`/api/v1/core/search/${id}/`);
  },
  
  // Get search results (using the URL from the search request)
  async getResults(resultUrl: string) {
    return api.get(resultUrl).then(({ data }) => data);
  }
};
