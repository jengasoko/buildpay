import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboardApi';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getStats().then((r) => r.data),
  });
}

export function useEmployeeDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'me'],
    queryFn: () => dashboardApi.getMe().then((r) => r.data),
  });
}

export function useEmployerDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'employer'],
    queryFn: () => dashboardApi.getEmployer().then((r) => r.data),
  });
}

export function useFinancialDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'financial'],
    queryFn: () => dashboardApi.getFinancial().then((r) => r.data),
  });
}

export function useRevenueTrend(months: number) {
  return useQuery({
    queryKey: ['dashboard', 'analytics', 'revenue-trend', months],
    queryFn: () => dashboardApi.getRevenueTrend(months).then((r) => r.data),
  });
}

export function useOccupancyTrend(months: number) {
  return useQuery({
    queryKey: ['dashboard', 'analytics', 'occupancy-trend', months],
    queryFn: () => dashboardApi.getOccupancyTrend(months).then((r) => r.data),
  });
}

export function useCollectionRate(months: number) {
  return useQuery({
    queryKey: ['dashboard', 'analytics', 'collection-rate', months],
    queryFn: () => dashboardApi.getCollectionRate(months).then((r) => r.data),
  });
}