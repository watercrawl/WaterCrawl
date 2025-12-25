import { PaginatedResponse } from '../../types/common';
import { Media } from '../../types/media';

import api from './api';

export interface MediaUploadOptions {
  file: File;
  metadata?: Record<string, unknown>;
}

export const mediaApi = {
  /**
   * List all media files for the current team
   */
  async list(): Promise<PaginatedResponse<Media>> {
    return api.get<PaginatedResponse<Media>>('/api/v1/user/media/').then(({ data }) => data);
  },

  /**
   * Upload a media file
   */
  async upload(options: MediaUploadOptions): Promise<Media> {
    const formData = new FormData();
    formData.append('file', options.file);
    if (options.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }

    const { data } = await api.post<Media>('/api/v1/user/media/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  /**
   * Delete a media file
   */
  async delete(uuid: string): Promise<void> {
    return api.delete(`/api/v1/user/media/${uuid}/`);
  },

  /**
   * Get download URL for a media file (signed URL with content-disposition)
   */
  getDownloadUrl(uuid: string): string {
    return `${api.defaults.baseURL}/api/v1/user/media/${uuid}/download/`;
  },
};



