import { PaginatedResponse } from '../../types/common';
import {
  CreateKnowledgeBaseDocumentRequest,
  KnowledgeBaseChunk,
  KnowledgeBaseContextAwareEnhanceData,
  KnowledgeBaseDetail,
  KnowledgeBaseDocument,
  KnowledgeBaseFormData,
  KnowledgeBaseQueryRequest,
  RetrievalSetting,
  RetrievalSettingFormData,
} from '../../types/knowledge';

import api from './api';

export const knowledgeBaseApi = {
  async list(page?: number, pageSize?: number, search?: string) {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('page_size', pageSize.toString());
    if (search) params.append('search', search);

    return api
      .get<
        PaginatedResponse<KnowledgeBaseDetail>
      >('/api/v1/knowledge-base/knowledge-bases/', { params })
      .then(({ data }) => data);
  },

  async get(uuid: string) {
    return api
      .get<KnowledgeBaseDetail>(`/api/v1/knowledge-base/knowledge-bases/${uuid}/`)
      .then(({ data }) => data);
  },

  async create(data: KnowledgeBaseFormData) {
    return api
      .post<KnowledgeBaseDetail>('/api/v1/knowledge-base/knowledge-bases/', data)
      .then(({ data }) => data);
  },

  async update(uuid: string, data: Partial<KnowledgeBaseFormData>) {
    return api
      .patch<KnowledgeBaseDetail>(`/api/v1/knowledge-base/knowledge-bases/${uuid}/`, data)
      .then(({ data }) => data);
  },

  async delete(uuid: string) {
    return api.delete(`/api/v1/knowledge-base/knowledge-bases/${uuid}/`);
  },

  async enhanceContextAware(data: KnowledgeBaseContextAwareEnhanceData) {
    return api
      .post<{
        content: string;
      }>('/api/v1/knowledge-base/knowledge-bases/context-aware-enhancer/', data)
      .then(({ data }) => data);
  },

  async getDocuments(knowledgeBaseUuid: string, page?: number, pageSize?: number) {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('page_size', pageSize.toString());

    return api
      .get<
        PaginatedResponse<KnowledgeBaseDocument>
      >(`/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseUuid}/documents/`, { params })
      .then(({ data }) => data);
  },

  async getDocument(knowledgeBaseUuid: string, uuid: string) {
    return api
      .get<KnowledgeBaseDocument>(
        `/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseUuid}/documents/${uuid}/`
      )
      .then(({ data }) => data);
  },

  async deleteDocument(knowledgeBaseUuid: string, uuid: string) {
    return api.delete(
      `/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseUuid}/documents/${uuid}/`
    );
  },

  async createDocument(knowledgeBaseUuid: string, data: CreateKnowledgeBaseDocumentRequest) {
    return api
      .post(`/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseUuid}/documents/`, data)
      .then(({ data }) => data);
  },

  async importFromUrls(knowledgeBaseUuid: string, data: { urls: string[] }) {
    return api
      .post(
        `/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseUuid}/documents/from-urls/`,
        data
      )
      .then(({ data }) => data);
  },

  async importFromCrawlResults(knowledgeBaseUuid: string, crawlResultUuids: string[]) {
    return api
      .post(
        `/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseUuid}/documents/from-crawl-results/`,
        { crawl_result_uuids: crawlResultUuids }
      )
      .then(({ data }) => data);
  },

  async importAllFromCrawlRequest(knowledgeBaseUuid: string, crawlRequestUuid: string) {
    return api
      .post(
        `/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseUuid}/documents/from-crawl-request/`,
        { crawl_request_uuid: crawlRequestUuid }
      )
      .then(({ data }) => data);
  },

  async importFromFiles(
    knowledgeBaseUuid: string,
    files: File[],
    onUploadProgress: (progressEvent: any) => void
  ) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    await api.post(
      `/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseUuid}/documents/from-files/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
      }
    );
  },
  async query(knowledgeBaseUuid: string, data: KnowledgeBaseQueryRequest) {
    return api
      .post(`/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseUuid}/query/`, data)
      .then(({ data }) => data);
  },
  async retry_indexing(knowledgeBaseUuid: string, documentUuid: string) {
    await api
      .post(
        `/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseUuid}/documents/${documentUuid}/retry-indexing/`
      )
      .then(({ data }) => data);
  },
  async getChunks(knowledgeBaseUuid: string) {
    return api
      .get<
        KnowledgeBaseChunk[]
      >(`/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseUuid}/chunks/`)
      .then(({ data }) => data);
  },
  async getDocumentChunks(
    knowledgeBaseUuid: string,
    documentUuid: string,
    page: number = 1,
    pageSize: number = 10
  ) {
    return api
      .get<PaginatedResponse<KnowledgeBaseChunk>>(
        `/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseUuid}/documents/${documentUuid}/chunks/`,
        {
          params: {
            page,
            page_size: pageSize,
          },
        }
      )
      .then(({ data }) => data);
  },

  // Retrieval Settings API
  async listRetrievalSettings(knowledgeBaseUuid: string) {
    return api
      .get<PaginatedResponse<RetrievalSetting>>(
        `/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseUuid}/retrieval-settings/`
      )
      .then(({ data }) => data);
  },

  async getRetrievalSetting(knowledgeBaseUuid: string, uuid: string) {
    return api
      .get<RetrievalSetting>(
        `/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseUuid}/retrieval-settings/${uuid}/`
      )
      .then(({ data }) => data);
  },

  async createRetrievalSetting(
    knowledgeBaseUuid: string,
    data: RetrievalSettingFormData
  ) {
    return api
      .post<RetrievalSetting>(
        `/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseUuid}/retrieval-settings/`,
        data
      )
      .then(({ data }) => data);
  },

  async updateRetrievalSetting(
    knowledgeBaseUuid: string,
    uuid: string,
    data: Partial<RetrievalSettingFormData>
  ) {
    return api
      .patch<RetrievalSetting>(
        `/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseUuid}/retrieval-settings/${uuid}/`,
        data
      )
      .then(({ data }) => data);
  },

  async deleteRetrievalSetting(knowledgeBaseUuid: string, uuid: string) {
    return api.delete(
      `/api/v1/knowledge-base/knowledge-bases/${knowledgeBaseUuid}/retrieval-settings/${uuid}/`
    );
  },
};
