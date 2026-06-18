import api from './api';

export const meritService = {
  async getAll(filters?: any) {
    const response = await api.get('/merit', { params: filters });
    return response.data;
  },

  async getByOperator(operatorId: number, status?: string) {
    const response = await api.get(`/merit/operator/${operatorId}`, {
      params: { status }
    });
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/merit', data);
    return response.data;
  },

  async approve(id: number) {
    const response = await api.put(`/merit/${id}/approve`);
    return response.data;
  },

  async reject(id: number) {
    const response = await api.put(`/merit/${id}/reject`);
    return response.data;
  }
};
