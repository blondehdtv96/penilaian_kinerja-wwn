import api from './api';

// Staff Produksi: CRUD terbatas pada user ber-role Operator (lihat backend/src/staff-produksi).
export const staffProduksiService = {
  listOperators: () => api.get('/staff-produksi/operators'),
  createOperator: (data: any) => api.post('/staff-produksi/operators', data),
  updateOperator: (id: number, data: any) => api.put(`/staff-produksi/operators/${id}`, data),
  deleteOperator: (id: number) => api.delete(`/staff-produksi/operators/${id}`),
  toggleOperator: (id: number) => api.patch(`/staff-produksi/operators/${id}/toggle-status`),
  resetPassword: (id: number, newPassword: string) => api.post(`/staff-produksi/operators/${id}/reset-password`, { newPassword }),
};
