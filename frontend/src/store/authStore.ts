import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (access: string, refresh: string, user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      setTokens: (access, refresh, user) => {
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
        set({ accessToken: access, refreshToken: refresh, user });
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          get().setTokens(data.accessToken, data.refreshToken, data.user);
        } finally {
          set({ isLoading: false });
        }
      },

      signup: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/signup', { name, email, password });
          get().setTokens(data.accessToken, data.refreshToken, data.user);
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          const refreshToken = get().refreshToken;
          await api.post('/auth/logout', { refreshToken }).catch(() => {});
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, accessToken: null, refreshToken: null });
        }
      },
    }),
    {
      name: 'veo-auth',
    }
  )
);
