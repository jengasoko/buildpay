import apiClient from '@/services/api';
import type { DashboardStats } from '@/types/api';

export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>('/api/v1/dashboard/stats'),
};