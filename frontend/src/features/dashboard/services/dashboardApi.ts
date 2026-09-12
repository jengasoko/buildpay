import apiClient from '@/services/api';
import type { House, PaginatedResponse, Project, QueryParams } from '@/types/api';

export const dashboardApi = {
  getProjects: (params?: QueryParams) =>
    apiClient.get<PaginatedResponse<Project>>('/api/v1/projects', { params }),
  getHouses: (params?: QueryParams) =>
    apiClient.get<PaginatedResponse<House>>('/api/v1/houses', { params }),
};
