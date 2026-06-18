import api from './api';

export const reportService = {
  async getOperatorPerformance(filters?: any) {
    const response = await api.get('/reports/operator-performance', {
      params: filters
    });
    return response.data;
  },

  async getMeritMisconduct(filters?: any) {
    const response = await api.get('/reports/merit-misconduct', {
      params: filters
    });
    return response.data;
  },

  async getDepartment() {
    const response = await api.get('/reports/department');
    return response.data;
  },

  async getBlockchainAudit(filters?: any) {
    const response = await api.get('/reports/blockchain-audit', {
      params: filters
    });
    return response.data;
  }
};
