import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/features/reports/services/reportsApi';

function unwrap<T>(promise: Promise<{ data: T }>) {
  return promise.then((r) => r.data);
}

export function useFinancialReport(year: number | null, month: number | null) {
  return useQuery({
    queryKey: ['reports', 'financial', year, month],
    queryFn: () => unwrap(reportsApi.financial(year as number, month as number)),
    enabled: !!year && !!month,
  });
}

export function useOccupancyReport() {
  return useQuery({
    queryKey: ['reports', 'occupancy'],
    queryFn: () => unwrap(reportsApi.occupancy()),
  });
}