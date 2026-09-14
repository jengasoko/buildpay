import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leasesApi } from '@/features/leases/services/leasesApi';
import type { ListLeaseParams } from '@/features/leases/services/leasesApi';

function unwrap<T>(promise: Promise<{ data: T }>) {
  return promise.then((r) => r.data);
}

export function useMyLease() {
  return useQuery({
    queryKey: ['leases', 'me'],
    queryFn: () => unwrap(leasesApi.getMy()),
  });
}

export function useLeases(params?: ListLeaseParams) {
  return useQuery({
    queryKey: ['leases', params ?? {}],
    queryFn: () => unwrap(leasesApi.list(params)),
  });
}

export function useLeaseStatement(leaseId: number | null | undefined) {
  return useQuery({
    queryKey: ['leases', leaseId, 'statement'],
    queryFn: () => unwrap(leasesApi.statement(leaseId as number)),
    enabled: !!leaseId,
  });
}

export function useSignLease(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leaseId: number) => unwrap(leasesApi.sign(leaseId)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leases'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      onSuccess?.();
    },
  });
}

export function useTerminateLease(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leaseId: number) => unwrap(leasesApi.terminate(leaseId)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leases'] });
      void qc.invalidateQueries({ queryKey: ['rooms'] });
      void qc.invalidateQueries({ queryKey: ['occupancies'] });
      void qc.invalidateQueries({ queryKey: ['houses'] });
      onSuccess?.();
    },
  });
}

export function useGenerateInvoice(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leaseId: number) => unwrap(leasesApi.generateInvoice(leaseId)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['invoices'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      void qc.invalidateQueries({ queryKey: ['arrears'] });
      void qc.invalidateQueries({ queryKey: ['reports'] });
      onSuccess?.();
    },
  });
}