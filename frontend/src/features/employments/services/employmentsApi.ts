import apiClient from '@/services/api';
import type { Employment, EmploymentCreate, PaginatedResponse, QueryParams } from '@/types/api';

export const employmentsApi = {
  list: (params?: QueryParams) =>
    apiClient.get<PaginatedResponse<Employment>>('/api/v1/employments/', { params }),
  create: (data: EmploymentCreate) =>
    apiClient.post<Employment>('/api/v1/employments/', data),
  delete: (id: number) => apiClient.delete(`/api/v1/employments/${id}`),
};