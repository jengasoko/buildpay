import apiClient from '@/services/api';
import type {
  CollectionRateResponse,
  DashboardStats,
  EmployeeDashboard,
  EmployerDashboard,
  FinancialDashboard,
  OccupancyTrendResponse,
  RevenueTrendResponse,
} from '@/types/api';

export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>('/api/v1/dashboard/stats'),
  getMe: () => apiClient.get<EmployeeDashboard>('/api/v1/dashboard/me'),
  getEmployer: () => apiClient.get<EmployerDashboard>('/api/v1/dashboard/employer'),
  getFinancial: () => apiClient.get<FinancialDashboard>('/api/v1/dashboard/financial'),
  getRevenueTrend: (months: number) =>
    apiClient.get<RevenueTrendResponse>('/api/v1/dashboard/analytics/revenue-trend', { params: { months } }),
  getOccupancyTrend: (months: number) =>
    apiClient.get<OccupancyTrendResponse>('/api/v1/dashboard/analytics/occupancy-trend', { params: { months } }),
  getCollectionRate: (months: number) =>
    apiClient.get<CollectionRateResponse>('/api/v1/dashboard/analytics/collection-rate', { params: { months } }),
  exportFinancialCsv: (year: number, month: number) =>
    apiClient.get('/api/v1/dashboard/reports/financial/export', {
      params: { year, month },
      responseType: 'blob',
    }),
  exportOccupancyCsv: () =>
    apiClient.get('/api/v1/dashboard/reports/occupancy/export', { responseType: 'blob' }),
  exportRevenueTrendCsv: (months: number) =>
    apiClient.get('/api/v1/dashboard/analytics/revenue-trend/export', {
      params: { months },
      responseType: 'blob',
    }),
};