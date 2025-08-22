
export interface AdminProvider {
    key: string;
    title: string;
}

export interface AdminProviderConfigRequest {
    title: string;
    provider_name: string;
    api_key?: string | null;
    base_url?: string | null;
}

export interface AdminProviderConfig {
    uuid: string;
    title: string;
    provider_name: string;
    api_key?: string | null;
    base_url?: string | null;
    created_at: string;
    updated_at: string;
}

export enum VisibilityLevel {
    NOT_AVAILABLE = 'not_available',
    AVAILABLE = 'available',
    TEAM_ONLY = 'team_only',
    PREMIUM = 'premium',
}

export interface AdminLLMModelRequest {
    name: string;
    key: string;
    provider_name: string;
    visibility_level: VisibilityLevel;
}

export interface AdminLLMModel {
    uuid: string;
    name: string;
    key: string;
    provider_name: string;
    visibility_level: VisibilityLevel;
    created_at: string;
    updated_at: string;
}

export interface AdminEmbeddingModelRequest {
    name: string;
    key: string;
    description: string;
    dimensions: number;
    max_input_length: number;
    truncate: string;
    provider_name: string;
    visibility_level: VisibilityLevel;
}

export interface AdminEmbeddingModel {
    uuid: string;
    name: string;
    key: string;
    description: string;
    dimensions: number;
    max_input_length: number;
    truncate: string;
    provider_name: string;
    visibility_level: VisibilityLevel;
    created_at: string;
    updated_at: string;
}
