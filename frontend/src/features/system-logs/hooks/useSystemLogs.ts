import { useQuery } from '@tanstack/react-query';
import { systemLogsApi } from '../services/systemLogsApi';
import type { QueryParams } from '@/types/api';

export function useSystemLogs(params?: QueryParams) {
  return useQuery({
    queryKey: ['system-logs', params],
    queryFn: () => systemLogsApi.list(params).then((r) => r.data),
  });
}