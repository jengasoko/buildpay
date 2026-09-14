import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { housesApi } from '../services/housesApi';
import type { HouseCreate, HouseUpdate, QueryParams } from '@/types/api';

const HOUSES_KEY = ['houses'] as const;

export function useHouses(params?: QueryParams) {
  return useQuery({
    queryKey: ['houses', params],
    queryFn: () => housesApi.list(params).then((r) => r.data),
  });
}

export function useCreateHouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: HouseCreate) => housesApi.create(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HOUSES_KEY }),
  });
}

export function useUpdateHouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: HouseUpdate }) =>
      housesApi.update(id, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HOUSES_KEY }),
  });
}

export function useDeleteHouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => housesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HOUSES_KEY }),
  });
}