import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../services/paymentsApi';
import type { PaymentCreate, QueryParams } from '@/types/api';

export function usePayments(params?: QueryParams) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => paymentsApi.list(params).then((r) => r.data),
  });
}

export function usePayment(id: number) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: () => paymentsApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PaymentCreate) => paymentsApi.create(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  });
}
