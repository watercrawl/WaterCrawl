export type ResponseMode = 'streaming' | 'blocking';

export type MessageType = 'ai' | 'tool' | 'human' | 'function';

/**
 * Tool call definition within an AI message
 * Represents a tool the AI wants to invoke
 */
export interface ToolCallDefinition {
  id: string;
  name: string;
  args: Record<string, any>;
  type: 'tool_call';
}

/**
 * Content part types for complex message content
 */
export interface TextContentPart {
  type: 'text';
  text: string;
  index?: number;
}

export interface ToolUseContentPart {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, any>;
  partial_json?: string;
  index?: number;
}

export interface ImageContentPart {
  type: 'image';
  source: {
    type: 'base64' | 'url';
    media_type: string;
    data: string;
  };
}

export interface FileContentPart {
  type: 'file';
  source: {
    type: 'base64' | 'url';
    media_type: string;
    data: string;
    filename?: string;
  };
}

export type ContentPart = TextContentPart | ToolUseContentPart | ImageContentPart | FileContentPart;

/**
 * Message content can be a string or an array of content parts
 */
export type MessageContent = string | ContentPart[];

/**
 * Individual message within a MessageBlock
 * Can be: AI message (with optional tool calls), Tool result, or Human message
 */
export interface ChatMessage {
  uuid: string;
  name: string | null; // Tool name for tool messages, null for AI/human
  message_type: MessageType;
  content: MessageContent;
  tool_calls: ToolCallDefinition[];
  tool_call_id?: string | null;
  additional_kwargs: any; // TODO: Define proper type later
  response_metadata: any; // TODO: Define proper type later
  created_at: string;
}

/**
 * MessageBlock - A card in the chat UI
 * Contains one or more messages from the same role
 * For user: typically 1 message
 * For assistant: 1+ messages (AI content, tool results, more AI content)
 */
export interface MessageBlock {
  uuid: string;
  role: 'user' | 'assistant';
  conversation_id: string;
  messages: ChatMessage[];
  structured_response?: Record<string, any> | null; // Structured JSON output when json_output is enabled
}

/**
 * Conversation - message blocks are fetched separately via ConversationMessageBlockViewSet
 * Message is the same as ChatMessage - use ChatMessage type instead
 */
export interface Conversation {
  uuid: string;
  title?: string;
  user_identifier?: string;
  agent: string;  // UUID
  agent_version: string;  // UUID
  inputs: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Chat Message Request
export interface ChatMessageRequest {
  query: string;
  user: string;
  response_mode?: ResponseMode;
  inputs?: Record<string, any>;
  conversation_id?: string;
  files?: string[]; // Array of Media file UUIDs
  output_schema?: Record<string, unknown> | null; // JSON Schema for structured output (required when agent has json_output=true but no predefined schema)
}

// File attachment for chat messages
export interface ChatFileAttachment {
  uuid: string;
  file_name: string;
  content_type: string;
  size: number;
  preview_url?: string; // For images
}

// Chat Message Response (Blocking Mode) - returns a MessageBlock
export type ChatMessageResponse = MessageBlock;

// SSE Event Types (Streaming Mode)
export type ChatEventType =
  | 'conversation'
  | 'user-message'
  | 'assistant-message'
  | 'chat_model_start'
  | 'content'
  | 'tool_call_start'
  | 'tool_call_end'
  | 'structured_response'
  | 'error'
  | 'done'
  | 'title';

// Base event structure
export interface BaseChatEvent {
  event: ChatEventType;
  data: Record<string, any>;
}

// Conversation event
export interface ConversationEvent extends BaseChatEvent {
  event: 'conversation';
  data: {
    id: string;
  };
}

// Message events
export interface UserMessageEvent extends BaseChatEvent {
  event: 'user-message';
  data: {
    id: string;
  };
}

export interface AssistantMessageEvent extends BaseChatEvent {
  event: 'assistant-message';
  data: {
    id: string;
  };
}

// Chat model start event
export interface ChatModelStartEvent extends BaseChatEvent {
  event: 'chat_model_start';
  data: {
    run_id: string;
  };
}

// Content streaming event
export interface ContentEvent extends BaseChatEvent {
  event: 'content';
  data: {
    text: string;
    run_id: string;
  };
}

// Tool call events
export interface ToolCallStartEvent extends BaseChatEvent {
  event: 'tool_call_start';
  data: {
    name: string;
    run_id: string;
    input: Record<string, any>;
  };
}

export interface ToolCallEndEvent extends BaseChatEvent {
  event: 'tool_call_end';
  data: {
    name: string;
    run_id: string;
    output: Record<string, any>;
  };
}

// Error event
export interface ErrorEvent extends BaseChatEvent {
  event: 'error';
  data: {
    error?: string;
    message?: string;
    code?: string | number;
  };
}

// Done event
export interface DoneEvent extends BaseChatEvent {
  event: 'done';
  data: Record<string, never>;
}

export interface TitleEvent extends BaseChatEvent {
  event: 'title';
  data: {
    title: string;
  };
}

// Structured response event
export interface StructuredResponseEvent extends BaseChatEvent {
  event: 'structured_response';
  data: Record<string, any>;
}

// Union type for all events
export type ChatEvent =
  | ConversationEvent
  | UserMessageEvent
  | AssistantMessageEvent
  | ChatModelStartEvent
  | ContentEvent
  | ToolCallStartEvent
  | ToolCallEndEvent
  | StructuredResponseEvent
  | ErrorEvent
  | DoneEvent
  | TitleEvent;

// ============================================
// UI State Types (for rendering in components)
// ============================================

/**
 * Parsed tool call for UI state management during streaming
 * Tracks status, timing, and output for display
 */
export interface ToolCallUIState {
  id: string; // run_id or tool call id
  name: string;
  input: Record<string, any>;
  output?: string | Record<string, any>;
  status: 'loading' | 'completed' | 'error';
  startedAt: number;
  completedAt?: number;
}

/**
 * Part of a message for UI rendering
 * Allows interleaving content and tool calls in display order
 */
export interface MessagePart {
  id: string;
  type: 'content' | 'tool_call';
  content?: string;
  toolCall?: ToolCallUIState;
  order: number;
}

/**
 * Processed MessageBlock for UI rendering
 * Converts backend MessageBlock to display-ready format
 */
export interface MessageBlockUI {
  id: string;
  role: 'user' | 'assistant';
  parts: MessagePart[];
  timestamp: number;
  structuredResponse?: Record<string, any> | null; // Structured JSON output when json_output is enabled
}

// Legacy alias for backwards compatibility
export type ToolCall = ToolCallUIState;
