import { UsageResponse } from '../../types/common';

import api from './api';

export const usageApi = {
  async getUsageStats(): Promise<UsageResponse> {
    return api.get<UsageResponse>('/api/v1/core/usage/').then(({ data }) => data);
  },
};
