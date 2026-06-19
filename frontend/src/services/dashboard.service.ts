import api from './api';

export const dashboardService = {
  kpi: () => api.get('/dashboard/kpi'),
  exportExcel: () => api.get('/dashboard/export/excel', { responseType: 'blob' }),
  exportPDF: () => api.get('/dashboard/export/pdf'),
};
