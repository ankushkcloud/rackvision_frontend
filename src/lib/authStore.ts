import { create } from 'zustand';
import { User } from '@/types';
import { authApi } from '@/lib/api';
import { AxiosError } from 'axios';

interface AuthState {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  isAuth: boolean;
  login:    (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout:   () => void;
  hydrate:  () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null, token: null, hydrated: false, isAuth: false,

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const t = localStorage.getItem('rv_token');
    const u = localStorage.getItem('rv_user');
    if (t && u) {
      try { set({ token: t, user: JSON.parse(u), isAuth: true, hydrated: true }); return; }
      catch { localStorage.removeItem('rv_token'); localStorage.removeItem('rv_user'); }
    }
    set({ hydrated: true });
  },

  login: async (email, password) => {
    const res = await authApi.login(email, password);
    const { token, user } = res.data;
    localStorage.setItem('rv_token', token);
    localStorage.setItem('rv_user', JSON.stringify(user));
    set({ token, user, isAuth: true });
  },

  register: async (name, email, password) => {
    const res = await authApi.register(name, email, password);
    const { token, user } = res.data;
    localStorage.setItem('rv_token', token);
    localStorage.setItem('rv_user', JSON.stringify(user));
    set({ token, user, isAuth: true });
  },

  logout: () => {
    localStorage.removeItem('rv_token');
    localStorage.removeItem('rv_user');
    set({ token: null, user: null, isAuth: false });
    window.location.href = '/auth/login';
  },
}));
