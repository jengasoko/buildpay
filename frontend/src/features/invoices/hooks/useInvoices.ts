import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/features/invoices/services/invoicesApi';
import type { ListInvoiceParams } from '@/features/invoices/services/invoicesApi';
import type { InvoiceAllocateRequest } from '@/types/api';

function unwrap<T>(promise: Promise<{ data: T }>) {
  return promise.then((r) => r.data);
}

export function useInvoices(params?: ListInvoiceParams) {
  return useQuery({
    queryKey: ['invoices', params ?? {}],
    queryFn: () => unwrap(invoicesApi.list(params)),
  });
}

export function useInvoice(id: number | null | undefined) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => unwrap(invoicesApi.get(id as number)),
    enabled: !!id,
  });
}

export function useArrears() {
  return useQuery({
    queryKey: ['arrears'],
    queryFn: () => unwrap(invoicesApi.arrears()),
  });
}

export function useAllocatePayment(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: InvoiceAllocateRequest }) =>
      unwrap(invoicesApi.allocate(id, data)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['invoices'] });
      void qc.invalidateQueries({ queryKey: ['payments'] });
      void qc.invalidateQueries({ queryKey: ['arrears'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      void qc.invalidateQueries({ queryKey: ['leases'] });
      onSuccess?.();
    },
  });
}