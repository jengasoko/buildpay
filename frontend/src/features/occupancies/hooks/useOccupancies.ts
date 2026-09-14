import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { occupanciesApi } from '../services/occupanciesApi';
import type { OccupancyParams } from '../services/occupanciesApi';

const OCCUPANCIES_KEY = ['occupancies'] as const;

export function useOccupancies(params?: OccupancyParams) {
  return useQuery({
    queryKey: ['occupancies', params],
    queryFn: () => occupanciesApi.list(params).then((r) => r.data),
  });
}

export function useOccupancy(id: number) {
  return useQuery({
    queryKey: ['occupancies', id],
    queryFn: () => occupanciesApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useEndOccupancy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => occupanciesApi.end(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OCCUPANCIES_KEY });
      queryClient.invalidateQueries({ queryKey: ['houses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}