import apiClient from '@/services/api';
import type { PaginatedResponse, QueryParams, SystemLog } from '@/types/api';

export const systemLogsApi = {
  list: (params?: QueryParams) =>
    apiClient.get<PaginatedResponse<SystemLog>>('/api/v1/system-logs/', { params }),
};