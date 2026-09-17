import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '@/features/maintenance/services/maintenanceApi';
import type { ListMaintenanceParams } from '@/features/maintenance/services/maintenanceApi';
import type { MaintenanceCreate, MaintenanceUpdate } from '@/types/api';

function unwrap<T>(promise: Promise<{ data: T }>) {
  return promise.then((r) => r.data);
}

export function useMaintenanceRequests(params?: ListMaintenanceParams) {
  return useQuery({
    queryKey: ['maintenance', params ?? {}],
    queryFn: () => unwrap(maintenanceApi.list(params)),
  });
}

export function useMaintenanceRequest(id: number | null | undefined) {
  return useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => unwrap(maintenanceApi.get(id as number)),
    enabled: !!id,
  });
}

export function useCreateMaintenance(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MaintenanceCreate) => unwrap(maintenanceApi.create(data)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['maintenance'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      onSuccess?.();
    },
  });
}

export function useUpdateMaintenance(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MaintenanceUpdate }) =>
      unwrap(maintenanceApi.update(id, data)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['maintenance'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      onSuccess?.();
    },
  });
}