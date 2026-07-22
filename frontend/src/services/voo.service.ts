import api from './api';

export interface VooCreatePayload {
  title: string;
  description: string;
  type: string; // 'VoO' | 'IdeKaizen'
  groupShift?: string; // mis. "A / 1" atau "- / NS"
  sumberVoo?: string; // Sumber VoO (Laporan Operator, Interview Patrol, dll.)
  kategori4m?: string; // Kategori 4M (Standard/Process, Mesin, Tools, Material, Lain-Lain)
  classification?: string; // JSON array: safety, environment, quality, cost, delivery
  photos?: string; // JSON string array (base64 data URL)
  operatorId?: number; // hanya jika Foreman mengajukan untuk operator
}

export const vooService = {
  getAll: (params?: { status?: string; operatorId?: number; type?: string }) =>
    api.get('/voo', { params }),
  getById: (id: number) => api.get(`/voo/${id}`),
  getMy: () => api.get('/voo/my'),
  create: (data: VooCreatePayload) => api.post('/voo', data),
  approveForeman: (id: number, body: { action: 'approve' | 'reject'; rejectionReason?: string }) =>
    api.post(`/voo/${id}/approve-foreman`, body),
  approveManager: (
    id: number,
    body: { action: 'approve' | 'reject'; points?: number; rejectionReason?: string }
  ) => api.post(`/voo/${id}/approve-manager`, body),
};
