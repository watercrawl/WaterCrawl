import { ProviderConfig } from './provider';

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

export enum RetrievalType {
  VectorSearch = 'vector_search',
  FullTextSearch = 'full_text_search',
  HybridSearch = 'hybrid_search',
}

export interface RetrievalSetting {
  uuid: string;
  name: string;
  knowledge_base: string;
  retrieval_type: RetrievalType;
  is_default: boolean;
  reranker_enabled: boolean;
  reranker_model_key: string | null;
  reranker_provider_config: ProviderConfig | null;
  reranker_model_config: Record<string, any> | null;
  top_k: number;
  hybrid_alpha: number | null;
  retrieval_cost: number;
  created_at: string;
  updated_at: string;
}

export interface RetrievalSettingFormData {
  name: string;
  retrieval_type: RetrievalType;
  is_default: boolean;
  reranker_enabled: boolean;
  reranker_model_key: string | null;
  reranker_provider_config_id: string | null;
  reranker_model_config?: Record<string, any> | null;
  top_k: number;
  hybrid_alpha: number | null;
}

export enum QueryStatus {
  New = 'new',
  Processing = 'processing',
  Finished = 'finished',
  Failed = 'failed',
}

export interface KnowledgeBaseQuery {
  uuid: string;
  knowledge_base: string;
  retrieval_setting: string | null;
  query_text: string;
  status: QueryStatus;
  results_count: number;
  retrieval_cost: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseDetail extends KnowledgeBase {
  chunk_size: number;
  chunk_overlap: number;
  embedding_model_key: string | null;
  embedding_provider_config: ProviderConfig | null;
  summarization_model_key: string | null;
  summarization_provider_config: ProviderConfig | null;
  summarizer_type: SummarizerType;
  summarizer_context: string | null;
  summarizer_llm_config: Record<string, unknown> | null;
  document_count: number;
  knowledge_base_each_document_cost: number;
  default_retrieval_setting: RetrievalSetting | null;
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
  embedding_model_key: string | null;
  embedding_provider_config_id: string | null;
  summarization_model_key: string | null;
  summarization_provider_config_id: string | null;
  summarizer_type: SummarizerType;
  summarizer_context?: string;
  summarizer_llm_config?: Record<string, unknown>;
  initial_retrieval_setting?: Partial<RetrievalSettingFormData>;
}

export interface KnowledgeBaseImportData {
  knowledge_base_id: string;
  crawl_request_id: string;
  urls: string[];
}

export interface KnowledgeBaseContextAwareEnhanceData {
  provider_config_id: string;
  llm_model_key: string;
  content: string;
  llm_model_config?: Record<string, unknown>;
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
  created_at: string;
  updated_at: string;
}

// Default and recommended values
export const DEFAULT_CHUNK_SIZE = 1024;
export const calculateChunkOverlap = (chunkSize: number) => Math.floor(chunkSize * 0.2); // 20% overlap as a best practice

export interface KnowledgeBaseQueryRequest {
  query: string;
  retrieval_setting_id?: string;
}
