export enum ProxyType {
  HTTP = 'http',
  SOCKS4 = 'socks4',
  SOCKS5 = 'socks5',
}

export interface Proxy {
  name: string;
  slug: string;
  is_default: boolean;
  proxy_type: ProxyType;
  host: string;
  port: number;
  username?: string | null;
  has_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsableProxy {
  category: string;
  name: string;
  slug: string;
}

export interface CreateProxyRequest extends Proxy {
  password?: string | null;
}

export interface TestProxyRequest {
  slug?: string;
  host?: string;
  port?: number;
  proxy_type?: ProxyType;
  username?: string | null;
  password?: string | null;
}
