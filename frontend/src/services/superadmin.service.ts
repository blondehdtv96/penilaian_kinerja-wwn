import api from './api';

// Admin V2 memakai endpoint /api/superadmin/* (implementasi sesuai schema terkini:
// role tunggal + permissions JSON). Endpoint /api/users & /api/roles lama TIDAK dipakai
// karena masih mereferensikan relasi schema lama (userRoles/rolePermissions).
export const superadminService = {
  // Users
  listUsers: () => api.get('/superadmin/users'),
  createUser: (data: any) => api.post('/superadmin/users', data),
  updateUser: (id: number, data: any) => api.put(`/superadmin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/superadmin/users/${id}`),
  toggleUser: (id: number) => api.patch(`/superadmin/users/${id}/toggle-status`),

  // Roles
  listRoles: () => api.get('/superadmin/roles'),
  createRole: (data: any) => api.post('/superadmin/roles', data),
  updateRole: (id: number, data: any) => api.put(`/superadmin/roles/${id}`, data),
  deleteRole: (id: number) => api.delete(`/superadmin/roles/${id}`),

  // QR Locations
  listQrLocations: () => api.get('/superadmin/qr-locations'),
  createQrLocation: (data: any) => api.post('/superadmin/qr-locations', data),
  updateQrLocation: (id: number, data: any) => api.put(`/superadmin/qr-locations/${id}`, data),
  deleteQrLocation: (id: number) => api.delete(`/superadmin/qr-locations/${id}`),
};
