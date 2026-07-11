import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (username: string, password: string) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
};

// Operators
export const operatorAPI = {
  getAll: (params?: any) => api.get('/operators', { params }),
  getById: (id: number) => api.get(`/operators/${id}`),
  myProfile: () => api.get('/operators/my-profile'),
  scanQR: (qrData: string) => api.post('/operators/scan-qr', { qrData }),
  ranking: (section?: string) => api.get('/operators/ranking', { params: { section } }),
};

// VoO Submissions
export const vooAPI = {
  getAll: (params?: any) => api.get('/voo', { params }),
  getById: (id: number) => api.get(`/voo/${id}`),
  create: (data: FormData) => api.post('/voo', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  mySubmissions: () => api.get('/voo/my'),
  approveForeman: (id: number, data: any) => api.post(`/voo/${id}/approve-foreman`, data),
  approveManager: (id: number, data: any) => api.post(`/voo/${id}/approve-manager`, data),
};

// Records (Misconduct, Counseling, Kartu Kuning, SP)
export const recordsAPI = {
  getMisconducts: (params?: any) => api.get('/records/misconduct', { params }),
  createMisconduct: (data: any) => api.post('/records/misconduct', data),
  getCounselings: (params?: any) => api.get('/records/counseling', { params }),
  createCounseling: (data: any) => api.post('/records/counseling', data),
  getKartuKuning: (params?: any) => api.get('/records/kartu-kuning', { params }),
  createKartuKuning: (data: any) => api.post('/records/kartu-kuning', data),
  getSuratPeringatan: (params?: any) => api.get('/records/surat-peringatan', { params }),
  createSuratPeringatan: (data: any) => api.post('/records/surat-peringatan', data),
};

// Violation catalog (drives Input Pelanggaran point values)
export const violationTypeAPI = {
  getAll: (params?: any) => api.get('/records/violation-types', { params }),
};

// Escalation thresholds (drives Kartu Kuning / Surat Peringatan override warnings)
export const escalationConfigAPI = {
  getActive: () => api.get('/records/escalation-config'),
};

// Integrated disciplinary history (chronological view across all 4 menus)
export const disciplinaryHistoryAPI = {
  getByOperator: (operatorId: number) => api.get(`/records/disciplinary-history/${operatorId}`),
  my: () => api.get('/records/disciplinary-history/my'),
};

// Dashboard
export const dashboardAPI = {
  kpi: () => api.get('/dashboard/kpi'),
  exportPDF: () => api.get('/dashboard/export/pdf'),
  exportExcel: () => api.get('/dashboard/export/excel', { responseType: 'blob' }),
};

// QR Locations
export const qrLocationAPI = {
  getAll: () => api.get('/qr-locations'),
};

// Blockchain
export const blockchainAPI = {
  status: () => api.get('/blockchain/status'),
  hashes: (params?: any) => api.get('/blockchain/hashes', { params }),
};

// Audit
export const auditAPI = {
  logs: (params?: any) => api.get('/audit-logs', { params }),
};
