import { PaginatedResponse } from '../../types/common';
import {
  ToolListItem,
  APISpec,
  APISpecCreateRequest,
  MCPServer,
  MCPServerCreateRequest,
  OAuthRedirectResponse,
  TestToolParams,
  TestToolResponse,
} from '../../types/tools';

import api from './api';

export const toolsApi = {
  // Built-in Tools (Read-only)
  async listTools(): Promise<PaginatedResponse<ToolListItem>> {
    const { data } = await api.get<PaginatedResponse<ToolListItem>>('/api/v1/agent/tools/');
    return data;
  },

  // Test any tool by UUID (mcp, api spec, or built-in)
  async testTool(uuid: string, params?: TestToolParams): Promise<TestToolResponse> {
    const { data } = await api.post<TestToolResponse>(`/api/v1/agent/tools/${uuid}/test/`, params);
    return data;
  },

  // Get a specific tool by UUID (mcp, api spec, or built-in)
  async getTool(uuid: string): Promise<ToolListItem> {
    const { data } = await api.get<ToolListItem>(`/api/v1/agent/tools/${uuid}/`);
    return data;
  },

  // API Specs
  async listApiSpecs(): Promise<PaginatedResponse<APISpec>> {
    const { data } = await api.get<PaginatedResponse<APISpec>>('/api/v1/agent/api-specs/');
    return data;
  },

  async getApiSpec(uuid: string): Promise<APISpec> {
    const { data } = await api.get<APISpec>(`/api/v1/agent/api-specs/${uuid}/`);
    return data;
  },

  async createApiSpec(request: APISpecCreateRequest): Promise<APISpec> {
    const { data } = await api.post<APISpec>(
      '/api/v1/agent/api-specs/',
      request
    );
    return data;
  },

  async deleteApiSpec(uuid: string): Promise<void> {
    await api.delete(`/api/v1/agent/api-specs/${uuid}/`);
  },

  // MCP Servers
  async listMcpServers(): Promise<PaginatedResponse<MCPServer>> {
    const { data } = await api.get<PaginatedResponse<MCPServer>>('/api/v1/agent/mcp-servers/');
    return data;
  },

  async getMcpServer(uuid: string): Promise<MCPServer> {
    const { data } = await api.get<MCPServer>(`/api/v1/agent/mcp-servers/${uuid}/`);
    return data;
  },

  async createMcpServer(request: MCPServerCreateRequest): Promise<MCPServer> {
    const { data } = await api.post<MCPServer>(
      '/api/v1/agent/mcp-servers/',
      request
    );
    return data;
  },

  async deleteMcpServer(uuid: string): Promise<void> {
    await api.delete(`/api/v1/agent/mcp-servers/${uuid}/`);
  },

  async getRedirectUrl(uuid: string): Promise<OAuthRedirectResponse> {
    const { data } = await api.get<OAuthRedirectResponse>(`/api/v1/agent/mcp-servers/${uuid}/oauth-redirect/`);
    return data;
  },

  async revalidateMcpServer(uuid: string): Promise<void> {
    await api.post(`/api/v1/agent/mcp-servers/${uuid}/revalidate/`);
  },


  // MCP Server Status Polling (for checking validation status)
  async pollMcpServerStatus(uuid: string): Promise<MCPServer> {
    return this.getMcpServer(uuid);
  },
};
