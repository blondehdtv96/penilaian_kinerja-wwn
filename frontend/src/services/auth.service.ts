import api from './api';

export const authService = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
  updateProfile: (payload: {
    email?: string;
    nik?: string | null;
    password?: string;
    currentPassword?: string;
  }) => api.patch('/auth/profile', payload),
};
