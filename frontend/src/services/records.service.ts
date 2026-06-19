import api from './api';

// Misconduct, Konseling, Kartu Kuning, Surat Peringatan — di-mount backend di /api/records.
export const recordsService = {
  listMisconduct: (operatorId?: number) =>
    api.get('/records/misconduct', { params: operatorId ? { operatorId } : {} }),
  createMisconduct: (data: {
    operatorId: number; type: string; severity: string; description: string;
    evidencePhotos?: string; points?: number;
  }) => api.post('/records/misconduct', data),

  listCounseling: (operatorId?: number) =>
    api.get('/records/counseling', { params: operatorId ? { operatorId } : {} }),
  createCounseling: (data: { operatorId: number; topic: string; notes?: string }) =>
    api.post('/records/counseling', data),

  listKartuKuning: (operatorId?: number) =>
    api.get('/records/kartu-kuning', { params: operatorId ? { operatorId } : {} }),
  createKartuKuning: (data: { operatorId: number; reason: string }) =>
    api.post('/records/kartu-kuning', data),

  listSuratPeringatan: (operatorId?: number) =>
    api.get('/records/surat-peringatan', { params: operatorId ? { operatorId } : {} }),
  createSuratPeringatan: (data: { operatorId: number; level: number; reason: string }) =>
    api.post('/records/surat-peringatan', data),
};
