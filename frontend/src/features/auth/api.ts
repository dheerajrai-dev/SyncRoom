import { apiClient } from '../../lib/api-client';
import type { LoginResponse, RefreshResponse, RegisterResponse, UserProfile } from './types';

export const authApi = {
  register: async (username: string, password: string): Promise<RegisterResponse> => {
    return apiClient<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  login: async (username: string, password: string): Promise<LoginResponse> => {
    return apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  refresh: async (): Promise<RefreshResponse> => {
    return apiClient<RefreshResponse>('/auth/refresh', {
      method: 'POST',
    });
  },

  logout: async (): Promise<{ status: string }> => {
    return apiClient<{ status: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  getMe: async (token: string): Promise<UserProfile> => {
    return apiClient<UserProfile>('/users/me', {
      method: 'GET',
      token,
    });
  },
};
