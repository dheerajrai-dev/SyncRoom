import { create } from 'zustand';
import { authApi } from './api';
import { setApiAccessToken } from '../../lib/api-client';
import type { AuthState, UserProfile } from './types';

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  accessToken: null,

  initializeSession: async () => {
    try {
      set({ status: 'loading' });
      const refreshRes = await authApi.refresh();
      const token = refreshRes.access_token;
      setApiAccessToken(token);
      
      const user = await authApi.getMe(token);
      set({
        status: 'authenticated',
        accessToken: token,
        user,
      });
    } catch {
      setApiAccessToken(null);
      set({
        status: 'unauthenticated',
        accessToken: null,
        user: null,
      });
    }
  },

  login: async (username: string, password: string): Promise<UserProfile> => {
    const res = await authApi.login(username, password);
    setApiAccessToken(res.access_token);
    set({
      status: 'authenticated',
      accessToken: res.access_token,
      user: res.user,
    });
    return res.user;
  },

  register: async (username: string, password: string): Promise<void> => {
    await authApi.register(username, password);
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      setApiAccessToken(null);
      set({
        status: 'unauthenticated',
        accessToken: null,
        user: null,
      });
    }
  },

  setUser: (user: UserProfile | null) => {
    set({ user });
  },

  setAccessToken: (accessToken: string | null) => {
    setApiAccessToken(accessToken);
    set({ accessToken });
  },
}));
