export interface OAuthRequest {
  provider: string;
  token: string;
}

export interface OAuthResponse {
  access: string;
  refresh: string;
  user: {
    uuid: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}
