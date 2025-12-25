// Tool System Types

import { ToolType } from './agent';

// Tool Parameter Type
export type ToolParameterType = 'header' | 'query' | 'path';

// API Spec Parameter
export interface APISpecParameter {
  uuid: string;
  tool_parameter_type: ToolParameterType;
  name: string;
  value: string;
}

// API Spec Tool - Specific to OpenAPI tools
export interface APISpecTool {
  uuid: string;
  name: string;
  description: string;
  key: string;
  method: string;  // GET, POST, PUT, PATCH, DELETE
  path: string;  // API endpoint path
  input_schema?: Record<string, any>;
  output_schema?: Record<string, any>;
  created_at: string;
}

// API Spec - Full response with parameters and tools
export interface APISpec {
  uuid: string;
  name: string;
  base_url: string;
  parameters: APISpecParameter[];
  tools: APISpecTool[];
  created_at: string;
}

// API Spec - Create request
export interface APISpecCreateRequest {
  name: string;
  base_url: string | null;
  api_spec: Record<string, any>;  // OpenAPI JSON
  parameters?: APISpecParameter[];
}

// MCP Server Status
export type MCPServerStatus = 'pending' | 'active' | 'error' | 'auth_required' | 'oauth_required';

// MCP Server Parameter
export interface MCPServerParameter {
  uuid?: string;
  tool_parameter_type: ToolParameterType;
  name: string;
  value: string;
}

// MCP Tool - Specific to MCP tools
export interface MCPTool {
  uuid: string;
  name: string;
  description: string;
  key: string;
  mcp_server: string;  // UUID
  mcp_server_name: string;
  input_schema?: Record<string, any>;
  output_schema?: Record<string, any>;
  created_at: string;
}

// MCP Server - Full response with parameters and tools
export interface MCPServer {
  uuid: string;
  name: string;
  url: string;
  status: MCPServerStatus;
  error_message: string | null;
  parameters: MCPServerParameter[];
  tools: MCPTool[];
  created_at: string;
  updated_at: string;
}

export interface MCPServerParameters {
  uuid?: string;
  tool_parameter_type: ToolParameterType;
  name: string;
  value: string;
}

// MCP Server - Create request
export interface MCPServerCreateRequest {
  name: string;
  url: string;
  parameters?: MCPServerParameters[];
}

// Tool List Item (generic - can be any type of tool)
export interface ToolListItem {
  uuid: string;
  name: string;
  description: string;
  key: string;
  tool_type: ToolType;
  input_schema?: Record<string, any>;
  output_schema?: Record<string, any>;
  created_at: string;
}


export interface OAuthRedirectResponse {
  redirect_url: string;
}

export interface TestToolParams {
  input?: Record<string, any>; // based on the tool's input schema
}

export interface TestToolResponse {
  content: Record<string, any> | string;
  artifact?: Record<string, any>;
}