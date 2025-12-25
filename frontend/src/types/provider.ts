/**
 * Model schema from the API
 */
export interface Model {
  key: string;
  label: string;
  model_type: string;
  features: string[];
  model_properties: Record<string, unknown>;
  parameters_schema: Record<string, unknown>;
}

/**
 * Model with availability status (includes is_active and is_custom)
 */
export interface ProviderModel extends Model {
  is_active: boolean;
  is_custom: boolean;
}

/**
 * Provider Embedding model schema
 */
export interface ProviderEmbedding {
  key: string;
  label: string;
  model_type: string;
  features: string[];
  model_properties: any;
  parameters_schema: any; // json schema for model parameters
}

export enum OPTIONS {
  REQUIRED = 'required',
  OPTIONAL = 'optional',
  NOT_AVAILABLE = 'not_available',
}
/**
 * Provider schema from the API
 */
export interface Provider {
  key: string;
  title: string;
  api_key: OPTIONS;
  base_url: OPTIONS;
  default_base_url: string | null;
}

/**
 * Provider Config schema from the API
 */
export interface ProviderConfig {
  uuid: string;
  title: string;
  provider_name: string; // Read-only field from API
  api_key?: string; // Write-only field
  base_url: string | null;
  is_global: boolean; // Read-only field from API
}

/**
 * Form data for creating/updating a provider config
 */
export interface ProviderConfigFormData {
  title: string;
  provider_name: string;
  api_key?: string;
  base_url?: string;
}

export interface ListProviderConfig {
  uuid: string;
  title: string;
  provider_name: string;
  base_url: string | null;
  is_global: boolean;
  available_llm_models: ProviderModel[];
  available_embedding_models: ProviderModel[];
  available_reranker_models: ProviderModel[];
}

/**
 * Detailed provider config with all models and their status
 */
export interface ProviderConfigDetail {
  uuid: string;
  title: string;
  provider_name: string;
  base_url: string | null;
  is_global: boolean;
  llm_models: ProviderModel[];
  embedding_models: ProviderModel[];
  reranker_models: ProviderModel[];
  custom_models: ProviderConfigModel[];
}

/**
 * Provider config model (database record)
 */
export interface ProviderConfigModel {
  uuid: string;
  model_key: string;
  model_type: ModelType;
  is_active: boolean;
  is_custom: boolean;
  label: string;
  custom_config: {
    features?: string[];
    model_properties?: Record<string, unknown>;
    parameters_schema?: Record<string, unknown>;
  };
}

/**
 * Model types
 */
export type ModelType = 'llm' | 'embedding' | 'reranker';

/**
 * Request payload for setting model status
 */
export interface SetModelStatusRequest {
  model_key: string;
  model_type: ModelType;
  is_active: boolean;
}

/**
 * Request payload for creating a custom model
 */
export interface CreateCustomModelRequest {
  model_key: string;
  model_type: ModelType;
  label: string;
  features?: string[];
  model_properties?: Record<string, unknown>;
  parameters_schema?: Record<string, unknown>;
}

/**
 * Request payload for updating a custom model
 */
export interface UpdateCustomModelRequest {
  label?: string;
  is_active?: boolean;
  features?: string[];
  model_properties?: Record<string, unknown>;
  parameters_schema?: Record<string, unknown>;
}
