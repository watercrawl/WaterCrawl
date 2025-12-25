// Agent System Types


export type AgentVersionStatus = 'draft' | 'published' | 'archived';

export type ToolType = 'api_spec' | 'built_in' | 'mcp';

// Agent - List response
export interface Agent {
  uuid: string;
  name: string;
  status: AgentVersionStatus;  // Derived from versions
  created_at: string;
  updated_at: string;
}

// Agent - Create request
export interface AgentCreateRequest {
  name: string;
}

// Agent - Update request
export interface AgentUpdateRequest {
  name?: string;
}

// Agent - Revert draft request
export interface AgentRevertDraftRequest {
  version_uuid: string;
}

// Agent Version - List item
export interface AgentVersionListItem {
  uuid: string;
  status: AgentVersionStatus;
  created_at: string;
  updated_at: string;
}

export interface ContextParameters {
  name: string;
  value: string;
  parameter_type: 'string' | 'number' | 'boolean';
}

// Agent Version - Detail
export interface AgentVersion {
  uuid: string;
  agent_name: string;
  status: AgentVersionStatus;
  system_prompt?: string;
  provider_config_uuid?: string;  // UUID
  llm_model_key?: string;
  llm_configs?: Record<string, any>;
  json_output?: boolean;  // Enable structured JSON output
  json_schema?: Record<string, any>;  // JSON Schema for output format
  parameters: ContextParameters[];
  created_at: string;
  updated_at: string;
}



// Agent Draft - Update request
export interface AgentDraftUpdateRequest {
  system_prompt?: string;
  provider_config_uuid?: string;  // UUID
  llm_model_key?: string;
  llm_configs?: Record<string, any>;
  json_output?: boolean;  // Enable structured JSON output
  json_schema?: Record<string, any>;  // JSON Schema for output format
  parameters: ContextParameters[];
}

// Tool - Base interface
export interface Tool {
  uuid: string;
  name: string;
  description: string;
  key: string;
  tool_type: ToolType;
  input_schema?: Record<string, any>;
  output_schema?: Record<string, any>;
  created_at: string;
}

// Agent Tool - Junction with config
export interface AgentTool {
  uuid: string;
  tool: Tool;
  config: Record<string, any>;  // User-filled input schema values
  created_at: string;
}

// Agent Tool - Create request
export interface AgentToolCreateRequest {
  tool_uuid: string;
  config: Record<string, any>;
}

// Agent Tool - Update request
export interface AgentToolUpdateRequest {
  config: Record<string, any>;
}


// Knowledge Base connection
export interface AgentKnowledgeBase {
  uuid: string;
  knowledge_base_uuid: string;
  config: Record<string, any>;  // ToolParametersConfig (same as tools)
  created_at: string;
  title: string;  // From knowledge base
  key: string;  // Generated key
  description: string;  // From knowledge base
  input_schema?: Record<string, any>;  // Schema for query and filters
}

// Agent Knowledge Base - Create request
export interface AgentKnowledgeBaseCreateRequest {
  knowledge_base_uuid: string;  // UUID (write-only field name)
  config?: {
    retrieval_setting_uuid?: string;  // UUID of the retrieval setting to use
  };
}

// Agent Knowledge Base - Update request
export interface AgentKnowledgeBaseUpdateRequest {
  config: Record<string, any>;
}

// Agent as Tool connection
export interface AgentAsTool {
  uuid: string;
  tool_agent_uuid: string;
  config: Record<string, any>;  // ToolParametersConfig
  created_at: string;
  name: string;  // From tool agent
  key: string;  // Generated key
  description: string;  // From tool agent
  input_schema?: Record<string, any>;  // Schema for query and inputs
}

// Agent as Tool - Create request
export interface AgentAsToolCreateRequest {
  tool_agent_uuid: string;  // UUID of the agent to use as tool
  config?: Record<string, any>;
}

// Agent as Tool - Update request
export interface AgentAsToolUpdateRequest {
  config: Record<string, any>;
}

// Tool Parameter Strategy Types
export type ToolParameterStrategy = 'fixed' | 'exclude' | 'llm' | 'keep';

// Strategy configuration for a single parameter
export interface ToolParameterStrategyConfig {
  strategy: ToolParameterStrategy;
  value?: unknown; // Only used when strategy is 'fixed'
  properties?: Record<string, ToolParameterStrategyConfig>; // Only used when strategy is 'keep' for nested objects
}

// Full tool configuration with parameter strategies
export interface ToolParametersConfig {
  function_name?: string; // Custom function name for the tool
  description?: string; // Custom description for the tool
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameterStrategyConfig>;
  };
}

// Test Session Types
export interface ContextVariable {
  key: string;
  value: string;
}

export interface TestSessionMessage {
  uuid: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface TestSessionToolCall {
  tool_name: string;
  tool_type: string;
  input: Record<string, any>;
  output: Record<string, any>;
  duration_ms: number;
}

export interface TestSessionExecutionStep {
  uuid: string;
  step_number: number;
  thought: string;
  action?: string;
  tool_calls: TestSessionToolCall[];
}

export interface TestSessionUsageMetrics {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  estimated_cost: number;
  currency: string;
}

export interface TestSession {
  uuid: string;
  messages: TestSessionMessage[];
  execution_history: TestSessionExecutionStep[];
  total_usage: TestSessionUsageMetrics;
}

// Test Query Request
export interface TestQueryRequest {
  agent_id: string;
  session_id: string;
  query: string;
  context_variables: Record<string, string>;
}

// Test Query Response
export interface TestQueryResponse {
  message: TestSessionMessage;
  execution_steps: TestSessionExecutionStep[];
  usage_metrics: TestSessionUsageMetrics;
}
