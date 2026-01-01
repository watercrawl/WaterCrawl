import { jwtDecode } from 'jwt-decode';

import { TokenPayload } from '../types/user';
import { API_URL } from '../utils/env';

export class AuthService {
  private static instance: AuthService;
  private refreshPromise: Promise<string> | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token);
  }

  setTokens(token: string, refreshToken: string): void {
    this.removeToken();
    this.setToken(token);
    this.setRefreshToken(refreshToken);
  }

  removeToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  isTokenExpired(): boolean {
    try {
      const token = this.getRefreshToken() as string;
      const decoded = jwtDecode<TokenPayload>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }

  async refreshToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        // Properly construct the URL to avoid issues with API_URL format
        // Use URL constructor to handle all edge cases (trailing slashes, relative/absolute paths)
        const path = '/api/v1/user/auth/token/refresh/';
        let url: string;
        
        if (!API_URL || API_URL === '/') {
          // If API_URL is root or empty, use relative path
          url = path;
        } else if (API_URL.startsWith('http://') || API_URL.startsWith('https://')) {
          // If API_URL is absolute, use URL constructor to properly join
          const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
          url = new URL(path, baseUrl).toString();
        } else {
          // If API_URL is relative, use current origin
          url = new URL(path, window.location.origin).toString();
        }
        
        const response = await fetch(url, {
          body: JSON.stringify({
            refresh: this.getRefreshToken(),
          }),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        const newToken = data.access;
        this.setToken(newToken);
        return newToken;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  static logout(): void {
    this.getInstance().removeToken();
    window.location.href = '/';
  }

  private getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }
}
