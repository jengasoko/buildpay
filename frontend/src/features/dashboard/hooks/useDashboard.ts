import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboardApi';

export function useDashboardData() {
  const projects = useQuery({
    queryKey: ['dashboard', 'projects'],
    queryFn: () => dashboardApi.getProjects({ page_size: 5 }).then((r) => r.data),
  });

  const houses = useQuery({
    queryKey: ['dashboard', 'houses'],
    queryFn: () => dashboardApi.getHouses({ page_size: 5 }).then((r) => r.data),
  });

  return { projects, houses };
}
