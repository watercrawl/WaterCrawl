import api from './api';

export const pluginsApi = {
  async getPluginSchema() {
    return api.get('/api/v1/core/plugins/schema').then(({ data }) => data);
  },
};
