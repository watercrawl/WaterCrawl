import axios from 'axios';

import { AuthService } from '../authService';
import { TeamService } from '../teamService';
import { API_URL } from '../../utils/env';


const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

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

export default api;