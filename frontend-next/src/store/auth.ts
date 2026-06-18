import { create } from 'zustand';
import { authAPI } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
  operator?: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isLoading: true,

  login: async (username, password) => {
    const res = await authAPI.login(username, password);
    const { token, user } = res.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isLoading: false });
    window.location.href = '/login';
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) { set({ isLoading: false }); return; }
    try {
      const res = await authAPI.me();
      set({ user: res.data.data, token, isLoading: false });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isLoading: false });
    }
  },

  hasPermission: (perm) => {
    return get().user?.permissions?.includes(perm) || false;
  },
}));
