import api from './api';

export const blockchainService = {
  status: () => api.get('/blockchain/status'),
  hashes: (params?: { entityType?: string; entityId?: number }) =>
    api.get('/blockchain/hashes', { params }),
};
