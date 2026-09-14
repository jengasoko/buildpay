import apiClient from '@/services/api';
import type { House, HouseCreate, HouseUpdate, PaginatedResponse, QueryParams } from '@/types/api';

export const housesApi = {
  list: (params?: QueryParams) =>
    apiClient.get<PaginatedResponse<House>>('/api/v1/houses', { params }),
  get: (id: number) => apiClient.get<House>(`/api/v1/houses/${id}`),
  create: (data: HouseCreate) => apiClient.post<House>('/api/v1/houses', data),
  update: (id: number, data: HouseUpdate) =>
    apiClient.put<House>(`/api/v1/houses/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/v1/houses/${id}`),
};