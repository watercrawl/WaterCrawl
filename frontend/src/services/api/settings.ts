import api from './api';
import { Settings } from '../../types/settings';

export const settingsApi = {
    async getSettings(): Promise<Settings> {
        return api.get<Settings>(
            '/api/v1/common/settings'
        ).then(({ data }) => data);
    },
};

export default settingsApi;
