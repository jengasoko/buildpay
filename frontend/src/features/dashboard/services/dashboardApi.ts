import apiClient from '@/services/api';
import type { DashboardStats, EmployeeDashboard } from '@/types/api';

export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>('/api/v1/dashboard/stats'),
  getMe: () => apiClient.get<EmployeeDashboard>('/api/v1/dashboard/me'),
};