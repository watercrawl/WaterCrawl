import { Settings } from '../../types/settings';

import api from './api';

export const settingsApi = {
  async getSettings(): Promise<Settings> {
    return api.get<Settings>('/api/v1/common/settings').then(({ data }) => data);
  },
};

export default settingsApi;
