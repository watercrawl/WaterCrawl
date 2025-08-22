import api from './api';
import { UsageHistory } from '../../types/usage_history';
import { PaginatedResponse } from '../../types/common';
import { ContentType } from '../../types/usage_history';

export const usageHistoryApi = {
    /**
     * Get a list of usage history
     * @returns Promise with array of usage history
     */
    async list(page: number, pageSize: number, teamApiKey?: string, contentType?: ContentType): Promise<PaginatedResponse<UsageHistory>> {
        return api.get<PaginatedResponse<UsageHistory>>('/api/v1/plan/usage-histories/', {
            params: {
                page,
                page_size: pageSize,
                team_api_key: teamApiKey || undefined,
                content_type: contentType || undefined
            }
        }).then(({ data }) => data);
    },
}