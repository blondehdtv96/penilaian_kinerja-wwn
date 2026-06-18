import api from './api';

export const dashboardService = {
  async getKPI() {
    const response = await api.get('/dashboard/kpi');
    return response.data;
  },

  async getPerformanceChart(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const response = await api.get('/dashboard/performance-chart', {
      params: { period }
    });
    return response.data;
  }
};
