import api from './api';

export const blockchainService = {
  async getBlockchain(page: number = 1, limit: number = 50) {
    const response = await api.get('/blockchain', {
      params: { page, limit }
    });
    return response.data;
  },

  async getBlock(blockIndex: number) {
    const response = await api.get(`/blockchain/${blockIndex}`);
    return response.data;
  },

  async verifyChain() {
    const response = await api.get('/blockchain/verify');
    return response.data;
  },

  async initializeGenesis() {
    const response = await api.post('/blockchain/genesis');
    return response.data;
  }
};
