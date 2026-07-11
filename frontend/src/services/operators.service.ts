import api from './api';

export const operatorService = {
  getAll: (params?: { section?: string; group?: string }) =>
    api.get('/operators', { params }),
  getById: (id: number) => api.get(`/operators/${id}`),
  myProfile: () => api.get('/operators/my-profile'),
  scanQR: (qrData: string) => api.post('/operators/scan-qr', { qrData }),
  ranking: (section?: string) => api.get('/operators/ranking', { params: section ? { section } : {} }),
};
