import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';
import { authService } from '@/services/auth.service';
import { useSocketStore } from './socket';
import type { AuthUser } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null);
  const user = ref<AuthUser | null>(null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const role = computed(() => user.value?.role ?? null);
  const isSuperAdmin = computed(() => user.value?.role === 'Super Admin');

  // V2: peran tunggal. Super Admin lolos semua cek (samakan dengan auth.middleware.ts).
  const hasRole = (r: string) => isSuperAdmin.value || user.value?.role === r;
  const hasAnyRole = (roles: string[]) =>
    isSuperAdmin.value || (!!user.value && roles.includes(user.value.role));
  const hasPermission = (p: string) =>
    isSuperAdmin.value || !!user.value?.permissions?.includes(p);

  const persist = () => {
    if (token.value) localStorage.setItem('token', token.value);
    if (user.value) localStorage.setItem('user', JSON.stringify(user.value));
  };

  const initializeAuth = async () => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) {
      token.value = t;
      try {
        user.value = JSON.parse(u) as AuthUser;
      } catch {
        user.value = null;
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    }
  };

  const login = async (username: string, password: string) => {
    loading.value = true;
    try {
      const { data } = await authService.login(username, password);
      if (!data?.success) return false;
      token.value = data.data.token;
      user.value = data.data.user;
      persist();
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
      useSocketStore().connect();
      return true;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    useSocketStore().disconnect();
  };

  const refreshUser = async () => {
    try {
      const { data } = await authService.me();
      if (data?.success) {
        user.value = data.data;
        persist();
      }
    } catch {
      /* abaikan */
    }
  };

  // Update profil sendiri (email, NIK, password) — untuk semua role.
  const updateProfile = async (payload: {
    email?: string;
    nik?: string | null;
    password?: string;
    currentPassword?: string;
  }) => {
    const { data } = await authService.updateProfile(payload);
    if (data?.success) {
      user.value = data.data;
      persist();
    }
    return data;
  };

  return {
    token,
    user,
    loading,
    isAuthenticated,
    role,
    isSuperAdmin,
    hasRole,
    hasAnyRole,
    hasPermission,
    initializeAuth,
    login,
    logout,
    refreshUser,
    updateProfile,
  };
});
