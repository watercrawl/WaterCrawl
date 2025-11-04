import { Model, ProviderConfig, ProviderEmbedding } from './provider';

export enum KnowledgeBaseStatus {
  Active = 'active',
  Archived = 'archived',
  Deleted = 'deleted',
}

export interface KnowledgeBase {
  uuid: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  status: KnowledgeBaseStatus;
}

export enum DocumentStatus {
  New = 'new',
  Crawling = 'crawling',
  Processing = 'processing',
  Ready = 'ready',
  Failed = 'failed',
}

export interface KnowledgeBaseDocument {
  uuid: string;
  title: string;
  source: string; // URI
  metadata: Record<string, string>;
  created_at: string;
  updated_at: string;
  status: DocumentStatus;
  error?: string; // Error message if processing failed
}

export interface KnowledgeBaseDetail extends KnowledgeBase {
  chunk_size: number;
  chunk_overlap: number;
  embedding_model: ProviderEmbedding;
  embedding_provider_config: ProviderConfig;
  summarization_model: Model;
  summarization_provider_config: ProviderConfig;
  summarizer_type: SummarizerType;
  summarizer_context: string;
  summarizer_temperature: number;
  document_count: number;
  knowledge_base_each_document_cost: number;
}

export enum SummarizerType {
  Standard = 'standard',
  ContextAware = 'context_aware',
}

export interface KnowledgeBaseFormData {
  title: string;
  description: string;
  chunk_size: number;
  chunk_overlap: number;
  embedding_model_id: string | null;
  embedding_provider_config_id: string | null;
  summarization_model_id: string | null;
  summarization_provider_config_id: string | null;
  summarizer_type: SummarizerType;
  summarizer_context?: string;
  summarizer_temperature?: number;
}

export interface KnowledgeBaseImportData {
  knowledge_base_id: string;
  crawl_request_id: string;
  urls: string[];
}

export interface KnowledgeBaseContextAwareEnhanceData {
  provider_config_id: string;
  llm_model_id: string;
  content: string;
  temperature: number | null;
}

export interface KnowledgeBaseContextAwareEnhanceResponse {
  enhanced_context: string;
}

export interface CreateKnowledgeBaseDocumentRequest {
  title: string;
  content: string;
}

export interface KnowledgeBaseChunk {
  uuid: string;
  index: number;
  document: string;
  content: string;
  keywords: string[];
  created_at: string;
  updated_at: string;
}

// Default and recommended values
export const DEFAULT_CHUNK_SIZE = 1024;
export const calculateChunkOverlap = (chunkSize: number) => Math.floor(chunkSize * 0.2); // 20% overlap as a best practice
