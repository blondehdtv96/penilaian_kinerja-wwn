import api from './api';

// Filter riwayat berdasarkan bulan (1-12) dan/atau tahun.
export interface MonthYearFilter {
  month?: number;
  year?: number;
}

// Misconduct, Konseling, Kartu Kuning, Surat Peringatan — di-mount backend di /api/records.
export const recordsService = {
  listMisconduct: (params?: { operatorId?: number; severity?: string; counselingStatus?: 'pending' | 'done' } & MonthYearFilter) =>
    api.get('/records/misconduct', { params: params || {} }),
  // Pelanggaran milik operator yang sedang login.
  listMyMisconduct: (params?: MonthYearFilter) => api.get('/records/misconduct/my', { params: params || {} }),
  // R2.1: poin diambil dari katalog (violationTypeId), bukan input manual.
  createMisconduct: (data: {
    operatorId: number; violationTypeId: number; description: string;
    severity?: string; evidencePhotos?: string;
  }) => api.post('/records/misconduct', data),

  // Katalog jenis pelanggaran (R1.6) — dikelola Section Manager, dibaca Foreman + Section Manager.
  listViolationTypes: () => api.get('/records/violation-types'),
  createViolationType: (data: { name: string; category: string; severity: string; points: number }) =>
    api.post('/records/violation-types', data),
  updateViolationType: (id: number, data: Partial<{ name: string; category: string; severity: string; points: number }>) =>
    api.patch(`/records/violation-types/${id}`, data),
  deactivateViolationType: (id: number) =>
    api.patch(`/records/violation-types/${id}/deactivate`),

  // Ambang batas eskalasi aktif (R4.6) — dasar peringatan manual override di form.
  getEscalationConfig: () => api.get('/records/escalation-config'),

  listCounseling: (operatorId?: number, filter?: MonthYearFilter) =>
    api.get('/records/counseling', { params: { ...(operatorId ? { operatorId } : {}), ...(filter || {}) } }),
  createCounseling: (data: {
    misconductId: number;
    topic: string;
    category?: string;
    pws?: string;
    employeeStatement?: string;
    supervisorSuggestion?: string;
    employeeCommitment?: string;
    location?: string;
    notes?: string;
  }) => api.post('/records/counseling', data),
  acknowledgeCounseling: (id: number) =>
    api.patch(`/records/counseling/${id}/acknowledge`),

  listKartuKuning: (operatorId?: number, filter?: MonthYearFilter) =>
    api.get('/records/kartu-kuning', { params: { ...(operatorId ? { operatorId } : {}), ...(filter || {}) } }),
  createKartuKuning: (data: { operatorId: number; reason: string }) =>
    api.post('/records/kartu-kuning', data),

  listSuratPeringatan: (operatorId?: number, filter?: MonthYearFilter) =>
    api.get('/records/surat-peringatan', { params: { ...(operatorId ? { operatorId } : {}), ...(filter || {}) } }),
  createSuratPeringatan: (data: { operatorId: number; level: number; reason: string }) =>
    api.post('/records/surat-peringatan', data),
};
