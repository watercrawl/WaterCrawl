
/**
 * Model schema from the API
 */
export interface Model {
  uuid: string;
  name: string;
  key: string;
  min_temperature: number | null;
  max_temperature: number | null;
  default_temperature: number | null;
}

/**
 * Provider Embedding model schema
 */
export interface ProviderEmbedding {
  uuid: string;
  name: string;
  key: string;
  description: string | null;
  dimensions: number;
  max_input_length: number;
  truncate: boolean;
}

/**
 * Provider schema from the API
 */
export interface Provider {
  key: string;
  title: string;
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
  api_key: string;
  base_url?: string;
}

export interface ListProviderConfig {
  uuid: string;
  title: string;
  provider_name: string;
  base_url: string | null;
  is_global: boolean;
  available_llm_models: Model[];
  available_embedding_models: ProviderEmbedding[];
}