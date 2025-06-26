import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

import { AuthService } from '../authService';
import { TeamService } from '../teamService';
import { API_URL } from '../../utils/env';

interface CustomAxiosInstance extends AxiosInstance {
  subscribeToSSE: <T>(url: string, config: AxiosRequestConfig, onEvent: (data: T) => void, onEnd?: () => void) => Promise<boolean>;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
}) as CustomAxiosInstance;

// Add a request interceptor to add the token and team ID to all requests
api.interceptors.request.use(
  async (config) => {
    const token = AuthService.getInstance().getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      // Add team ID to header if available
      const teamId = TeamService.getInstance().getCurrentTeamId();
      if (teamId) {
        config.headers['x-team-id'] = teamId;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await AuthService.getInstance().refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        AuthService.getInstance().removeToken();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

api.subscribeToSSE = async <T>(url: string, config: AxiosRequestConfig, onEvent: (data: T) => void, onEnd?: () => void) => {
  const apiUrl = new URL(url, api.defaults.baseURL);
  // apiUrl.searchParams.append('prefetched', 'true');
  // set query param from config
  for (const [key, value] of Object.entries(config.params || {})) {
    apiUrl.searchParams.append(key, value as string);
  }

  try {
    // Create a fetch request with the correct headers for SSE
    const headers = new Headers();
    headers.set('Connection', 'keep-alive');
    headers.set('Authorization', "Bearer " + AuthService.getInstance().getToken()!);
    headers.set('x-team-id', TeamService.getInstance().getCurrentTeamId()!);
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported');
    }

    // Create a reader to process the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Process the stream
    const processStream = async () => {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Stream is complete
          if (onEnd) {
            onEnd();
          }
          break;
        }

        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines in the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (jsonStr) {
                const data = JSON.parse(jsonStr);
                onEvent(data);
              }
            } catch (error) {
              console.error('Error parsing SSE data:', error);
            }
          }
        }
      }
    };

    // Start processing the stream in the background
    processStream().catch(error => {
      console.error('Stream processing error:', error);
      if (onEnd) {
        onEnd();
      }
    });

    return true; // Indicate successful subscription
  } catch (error) {
    console.error('Error setting up SSE connection:', error);
    if (onEnd) {
      onEnd();
    }
    throw error;
  }
};
export default api;