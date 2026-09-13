import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employmentsApi } from '../services/employmentsApi';
import type { EmploymentCreate } from '@/types/api';

const EMPLOYMENTS_KEY = ['employments'] as const;

export function useEmployments(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: ['employments', page, pageSize],
    queryFn: () =>
      employmentsApi.list({ page, page_size: pageSize }).then((r) => r.data),
  });
}

export function useCreateEmployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmploymentCreate) =>
      employmentsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYMENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteEmployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYMENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}