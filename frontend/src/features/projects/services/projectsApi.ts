import apiClient from '@/services/api';
import type { PaginatedResponse, Project, ProjectCreate, ProjectUpdate, QueryParams } from '@/types/api';

export const projectsApi = {
  list: (params?: QueryParams) =>
    apiClient.get<PaginatedResponse<Project>>('/api/v1/projects', { params }),
  get: (id: number) => apiClient.get<Project>(`/api/v1/projects/${id}`),
  create: (data: ProjectCreate) => apiClient.post<Project>('/api/v1/projects', data),
  update: (id: number, data: ProjectUpdate) =>
    apiClient.put<Project>(`/api/v1/projects/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/v1/projects/${id}`),
};