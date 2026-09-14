import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '../services/applicationsApi';
import type { ApplicationCreate, ApplicationStatus, ApplicationUpdate, QueryParams } from '@/types/api';

const APPLICATIONS_KEY = ['applications'] as const;

export function useApplications(params?: QueryParams & { status?: ApplicationStatus }) {
  return useQuery({
    queryKey: ['applications', params],
    queryFn: () => applicationsApi.list(params).then((r) => r.data),
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ApplicationCreate) => applicationsApi.create(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY }),
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ApplicationUpdate }) =>
      applicationsApi.update(id, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY }),
  });
}