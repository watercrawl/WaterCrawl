export interface Settings {
    is_enterprise_mode_active: boolean;
    github_client_id?: string;
    google_client_id?: string;
    is_login_active: boolean;
    is_signup_active: boolean;
    is_github_login_active: boolean;
    is_google_login_active: boolean;
    google_analytics_id?: string;
    api_version: string;
    policy_url: string;
    terms_url: string;
    policy_update_at: string;
    terms_update_at: string;
    is_installed: boolean;
    is_search_configured: boolean;
    max_crawl_concurrency: number;
    mcp_server: string;
    is_knowledge_base_enabled: boolean;
}
