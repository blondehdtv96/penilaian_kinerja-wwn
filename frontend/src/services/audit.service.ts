import api from './api';

export const auditService = {
  logs: (params?: { module?: string; action?: string; userId?: number }) =>
    api.get('/audit-logs', { params }),
};
