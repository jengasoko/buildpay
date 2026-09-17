import apiClient from '@/services/api';
import type { FinancialReport, OccupancyReport } from '@/types/api';

export const reportsApi = {
  financial: (year: number, month: number) =>
    apiClient.get<FinancialReport>('/api/v1/dashboard/reports/financial', {
      params: { year, month },
    }),
  occupancy: () =>
    apiClient.get<OccupancyReport>('/api/v1/dashboard/reports/occupancy'),
  exportFinancial: (year: number, month: number) =>
    apiClient.get('/api/v1/dashboard/reports/financial/export', {
      params: { year, month },
      responseType: 'blob',
    }),
  exportOccupancy: () =>
    apiClient.get('/api/v1/dashboard/reports/occupancy/export', { responseType: 'blob' }),
};