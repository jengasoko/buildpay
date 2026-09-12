import apiClient from '@/services/api';
import type { PaginatedResponse, QueryParams, User, UserCreate, UserUpdate } from '@/types/api';

export const usersApi = {
  list: (params?: QueryParams) =>
    apiClient.get<PaginatedResponse<User>>('/api/v1/users/', { params }),
  get: (id: number) => apiClient.get<User>(`/api/v1/users/${id}`),
  update: (id: number, data: UserUpdate) => apiClient.put<User>(`/api/v1/users/${id}`, data),
  create: (data: UserCreate) => apiClient.post<User>('/api/v1/auth/register', data),
};
