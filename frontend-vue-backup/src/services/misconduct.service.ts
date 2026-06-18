import api from './api';

export const misconductService = {
  async getAll(filters?: any) {
    const response = await api.get('/misconduct', { params: filters });
    return response.data;
  },

  async getByOperator(operatorId: number, status?: string) {
    const response = await api.get(`/misconduct/operator/${operatorId}`, {
      params: { status }
    });
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/misconduct', data);
    return response.data;
  },

  async approve(id: number) {
    const response = await api.put(`/misconduct/${id}/approve`);
    return response.data;
  },

  async reject(id: number) {
    const response = await api.put(`/misconduct/${id}/reject`);
    return response.data;
  }
};
