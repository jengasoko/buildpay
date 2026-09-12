import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../services/projectsApi';
import type { ProjectCreate, ProjectUpdate, QueryParams } from '@/types/api';

const PROJECTS_KEY = ['projects'] as const;

export function useProjects(params?: QueryParams) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectsApi.list(params).then((r) => r.data),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProjectCreate) => projectsApi.create(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProjectUpdate }) =>
      projectsApi.update(id, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECTS_KEY }),
  });
}