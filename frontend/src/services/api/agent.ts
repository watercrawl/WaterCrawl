import {
  Agent,
  AgentCreateRequest,
  AgentUpdateRequest,
  AgentRevertDraftRequest,
  AgentVersionListItem,
  AgentVersion,
  AgentDraftUpdateRequest,
  AgentTool,
  AgentToolCreateRequest,
  AgentToolUpdateRequest,
  AgentKnowledgeBase,
  AgentKnowledgeBaseCreateRequest,
  AgentKnowledgeBaseUpdateRequest,
  AgentAsTool,
  AgentAsToolCreateRequest,
  AgentAsToolUpdateRequest,
  TestSession,
  TestQueryRequest,
  TestQueryResponse,
} from '../../types/agent';
import { PaginatedResponse } from '../../types/common';
import {
  ChatMessageRequest,
  ChatMessageResponse,
  ChatEvent,
} from '../../types/conversation';

import api from './api';


export const agentApi = {
  // Agent CRUD
  async list(page?: number, pageSize?: number, search?: string, filters?: Record<string, string>): Promise<PaginatedResponse<Agent>> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('page_size', pageSize.toString());
    if (search) params.append('search', search);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const { data } = await api.get<PaginatedResponse<Agent>>('/api/v1/agent/agents/', {
      params,
    });
    return data;
  },

  async get(uuid: string): Promise<Agent> {
    const { data } = await api.get<Agent>(`/api/v1/agent/agents/${uuid}/`);
    return data;
  },

  async create(request: AgentCreateRequest): Promise<Agent> {
    const { data } = await api.post<Agent>('/api/v1/agent/agents/', request);
    return data;
  },

  async update(uuid: string, request: AgentUpdateRequest): Promise<Agent> {
    const { data } = await api.patch<Agent>(
      `/api/v1/agent/agents/${uuid}/`,
      request
    );
    return data;
  },

  async delete(uuid: string): Promise<void> {
    await api.delete(`/api/v1/agent/agents/${uuid}/`);
  },

  // Agent Versions (moved to separate endpoint)
  async listVersions(agentUuid: string): Promise<PaginatedResponse<AgentVersionListItem>> {
    const { data } = await api.get<PaginatedResponse<AgentVersionListItem>>(
      `/api/v1/agent/agents/${agentUuid}/versions/`
    );
    return data;
  },

  async getVersion(agentUuid: string, versionUuid: string): Promise<AgentVersion> {
    const { data } = await api.get<AgentVersion>(
      `/api/v1/agent/agents/${agentUuid}/versions/${versionUuid}/`
    );
    return data;
  },

  async getPublishedVersion(agentUuid: string): Promise<AgentVersion> {
    const { data } = await api.get<AgentVersion>(
      `/api/v1/agent/agents/${agentUuid}/current-published/`
    );
    return data;
  },

  // Draft Management
  async getDraft(agentUuid: string): Promise<AgentVersion> {
    const { data } = await api.get<AgentVersion>(
      `/api/v1/agent/agents/${agentUuid}/draft/`
    );
    return data;
  },

  async updateDraft(
    agentUuid: string,
    request: AgentDraftUpdateRequest
  ): Promise<AgentVersion> {
    const { data } = await api.patch<AgentVersion>(
      `/api/v1/agent/agents/${agentUuid}/draft/`,
      request
    );
    return data;
  },

  async publishDraft(agentUuid: string): Promise<void> {
    await api.post(
      `/api/v1/agent/agents/${agentUuid}/draft/publish/`
    );
  },

  async revertDraft(agentUuid: string, request: AgentRevertDraftRequest): Promise<AgentVersion> {
    const { data } = await api.post<AgentVersion>(
      `/api/v1/agent/agents/${agentUuid}/revert-draft/`,
      request
    );
    return data;
  },

  // Draft Tools
  async listDraftTools(agentUuid: string): Promise<AgentTool[]> {
    const { data } = await api.get<AgentTool[]>(
      `/api/v1/agent/agents/${agentUuid}/draft/tools/`
    );
    return data;
  },

  async addDraftTool(
    agentUuid: string,
    request: AgentToolCreateRequest
  ): Promise<AgentTool> {
    const { data } = await api.post<AgentTool>(
      `/api/v1/agent/agents/${agentUuid}/draft/tools/`,
      request
    );
    return data;
  },

  async updateDraftTool(
    agentUuid: string,
    toolUuid: string,
    request: AgentToolUpdateRequest
  ): Promise<AgentTool> {
    const { data } = await api.patch<AgentTool>(
      `/api/v1/agent/agents/${agentUuid}/draft/tools/${toolUuid}/`,
      request
    );
    return data;
  },

  async removeDraftTool(agentUuid: string, toolUuid: string): Promise<void> {
    await api.delete(`/api/v1/agent/agents/${agentUuid}/draft/tools/${toolUuid}/`);
  },

  // Draft Knowledge Bases
  async listDraftKnowledgeBases(agentUuid: string): Promise<AgentKnowledgeBase[]> {
    const { data } = await api.get<AgentKnowledgeBase[]>(
      `/api/v1/agent/agents/${agentUuid}/draft/knowledge-bases/`
    );
    return data;
  },

  async addDraftKnowledgeBase(
    agentUuid: string,
    request: AgentKnowledgeBaseCreateRequest
  ): Promise<AgentKnowledgeBase> {
    const { data } = await api.post<AgentKnowledgeBase>(
      `/api/v1/agent/agents/${agentUuid}/draft/knowledge-bases/`,
      {
        knowledge_base_uuid: request.knowledge_base_uuid,
        config: request.config || {}
      }
    );
    return data;
  },

  async updateDraftKnowledgeBase(
    agentUuid: string,
    kbUuid: string,
    request: AgentKnowledgeBaseUpdateRequest
  ): Promise<AgentKnowledgeBase> {
    const { data } = await api.patch<AgentKnowledgeBase>(
      `/api/v1/agent/agents/${agentUuid}/draft/knowledge-bases/${kbUuid}/`,
      request
    );
    return data;
  },

  async removeDraftKnowledgeBase(agentUuid: string, kbUuid: string): Promise<void> {
    await api.delete(
      `/api/v1/agent/agents/${agentUuid}/draft/knowledge-bases/${kbUuid}/`
    );
  },

  // Agent Tools
  async getDraftAgentTools(agentUuid: string): Promise<AgentAsTool[]> {
    const { data } = await api.get<AgentAsTool[]>(
      `/api/v1/agent/agents/${agentUuid}/draft/agent-tools/`
    );
    return data;
  },

  async addDraftAgentTool(
    agentUuid: string,
    request: AgentAsToolCreateRequest
  ): Promise<AgentAsTool> {
    const { data } = await api.post<AgentAsTool>(
      `/api/v1/agent/agents/${agentUuid}/draft/agent-tools/`,
      {
        tool_agent_uuid: request.tool_agent_uuid,
        config: request.config || {}
      }
    );
    return data;
  },

  async updateDraftAgentTool(
    agentUuid: string,
    agentToolUuid: string,
    request: AgentAsToolUpdateRequest
  ): Promise<AgentAsTool> {
    const { data } = await api.patch<AgentAsTool>(
      `/api/v1/agent/agents/${agentUuid}/draft/agent-tools/${agentToolUuid}/`,
      request
    );
    return data;
  },

  async removeDraftAgentTool(agentUuid: string, agentToolUuid: string): Promise<void> {
    await api.delete(
      `/api/v1/agent/agents/${agentUuid}/draft/agent-tools/${agentToolUuid}/`
    );
  },

  // Chat with Draft Agent - Blocking Mode
  // Note: output_schema is required when agent has json_output=true but no predefined json_schema
  async chatWithDraftBlocking(
    agentUuid: string,
    request: ChatMessageRequest
  ): Promise<ChatMessageResponse> {
    const { data } = await api.post<ChatMessageResponse>(
      `/api/v1/agent/agents/${agentUuid}/draft/chat-message/`,
      { ...request, response_mode: 'blocking' }
    );
    return data;
  },

  // Chat with Draft Agent - Streaming Mode
  // Note: output_schema is required when agent has json_output=true but no predefined json_schema
  async chatWithDraftStreaming(
    agentUuid: string,
    request: Omit<ChatMessageRequest, 'response_mode'>,
    onEvent: (data: ChatEvent) => void,
    onEnd?: () => void
  ): Promise<void> {
    await api.sseRequest<ChatEvent>(
      `/api/v1/agent/agents/${agentUuid}/draft/chat-message/`,
      'POST',
      {},
      { ...request, response_mode: 'streaming' },
      onEvent,
      onEnd
    );
  },

  // Chat with Published Agent - Blocking Mode
  // Note: output_schema is required when agent has json_output=true but no predefined json_schema
  async chatWithPublishedBlocking(
    agentUuid: string,
    request: ChatMessageRequest
  ): Promise<ChatMessageResponse> {
    const { data } = await api.post<ChatMessageResponse>(
      `/api/v1/agent/agents/${agentUuid}/chat-message/`,
      { ...request, response_mode: 'blocking' }
    );
    return data;
  },

  // Chat with Published Agent - Streaming Mode
  // Note: output_schema is required when agent has json_output=true but no predefined json_schema
  async chatWithPublishedStreaming(
    agentUuid: string,
    request: Omit<ChatMessageRequest, 'response_mode'>,
    onEvent: (data: ChatEvent) => void,
    onEnd?: () => void
  ): Promise<void> {
    await api.sseRequest<ChatEvent>(
      `/api/v1/agent/agents/${agentUuid}/chat-message/`,
      'POST',
      {},
      { ...request, response_mode: 'streaming' },
      onEvent,
      onEnd
    );
  },

  // Test Session Management
  async createTestSession(agentUuid: string): Promise<TestSession> {
    const { data } = await api.post<TestSession>(
      `/api/v1/agent/agents/${agentUuid}/test-sessions/`
    );
    return data;
  },

  async sendTestQuery(request: TestQueryRequest): Promise<TestQueryResponse> {
    const { data } = await api.post<TestQueryResponse>(
      `/api/v1/agent/agents/${request.agent_id}/test-sessions/${request.session_id}/query/`,
      request
    );
    return data;
  },
};
