import api from './api';

export const operatorService = {
  async getAll(filters?: any) {
    const response = await api.get('/operators', { params: filters });
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get(`/operators/${id}`);
    return response.data;
  },

  async getByEmployeeId(employeeId: string) {
    const response = await api.get(`/operators/employee/${employeeId}`);
    return response.data;
  },

  async getRanking(limit: number = 10) {
    const response = await api.get('/operators/ranking', { params: { limit } });
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/operators', data);
    return response.data;
  },

  async update(id: number, data: any) {
    const response = await api.put(`/operators/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete(`/operators/${id}`);
    return response.data;
  },

  async scanQR(qrData: string) {
    const response = await api.post('/operators/scan', { qrData });
    return response.data;
  }
};
