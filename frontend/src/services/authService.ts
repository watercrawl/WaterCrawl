import { jwtDecode } from 'jwt-decode';
import { API_URL } from '../utils/env';
import { TokenPayload } from '../types/user';

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
        const response = await fetch(`${API_URL}/api/v1/user/auth/token/refresh/`, {
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
