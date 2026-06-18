import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';
import { useSocketStore } from './socket';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  operator?: any;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null);
  const user = ref<User | null>(null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  const hasRole = (role: string) => {
    return user.value?.roles.includes(role) || false;
  };

  const hasAnyRole = (roles: string[]) => {
    return roles.some(role => hasRole(role));
  };

  const hasPermission = (permission: string) => {
    return user.value?.permissions.includes(permission) || false;
  };

  const initializeAuth = async () => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      token.value = storedToken;
      user.value = JSON.parse(storedUser);
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
  };

  const login = async (username: string, password: string) => {
    loading.value = true;
    try {
      const response = await api.post('/auth/login', { username, password });
      
      if (response.data.success) {
        token.value = response.data.data.token;
        user.value = response.data.data.user;

        localStorage.setItem('token', token.value!);
        localStorage.setItem('user', JSON.stringify(user.value));
        
        api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;

        // Connect socket after login
        const socketStore = useSocketStore();
        socketStore.connect();

        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
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

    // Disconnect socket
    const socketStore = useSocketStore();
    socketStore.disconnect();
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        user.value = response.data.data;
        localStorage.setItem('user', JSON.stringify(user.value));
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return {
    token,
    user,
    loading,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    hasPermission,
    initializeAuth,
    login,
    logout,
    refreshUser
  };
});
