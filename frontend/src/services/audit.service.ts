import api from './api';

export const auditService = {
  logs: (params?: { module?: string; action?: string; userId?: number; month?: number; year?: number }) =>
    api.get('/audit-logs', { params }),
};
