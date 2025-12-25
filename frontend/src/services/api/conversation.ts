import { PaginatedResponse } from '../../types/common';
import { Conversation, MessageBlock } from '../../types/conversation';

import api from './api';

export const conversationApi = {
  // List all conversations with optional agent filter and pagination
  async list(
    agentUuid?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Conversation>> {
    const params: Record<string, string | number> = {
      page,
      page_size: pageSize,
    };
    if (agentUuid) {
      params.agent = agentUuid;
    }
    const { data } = await api.get<PaginatedResponse<Conversation>>(
      '/api/v1/agent/conversations/',
      { params }
    );
    return data;
  },

  // Get single conversation details
  async get(conversationUuid: string): Promise<Conversation> {
    const { data } = await api.get<Conversation>(
      `/api/v1/agent/conversations/${conversationUuid}/`
    );
    return data;
  },

  // Get conversation message blocks (ordered by created_at ascending)
  async getMessageBlocks(
    conversationUuid: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<MessageBlock>> {
    const params = { page, page_size: pageSize };
    const { data } = await api.get<PaginatedResponse<MessageBlock>>(
      `/api/v1/agent/conversations/${conversationUuid}/blocks/`,
      { params }
    );
    return data;
  },
};
