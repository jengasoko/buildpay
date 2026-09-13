import apiClient from '@/services/api';
import type { Occupancy, PaginatedResponse, QueryParams } from '@/types/api';

export interface OccupancyParams extends QueryParams {
  current_only?: boolean;
}

export const occupanciesApi = {
  list: (params?: OccupancyParams) =>
    apiClient.get<PaginatedResponse<Occupancy>>('/api/v1/occupancies/', { params }),
  get: (id: number) => apiClient.get<Occupancy>(`/api/v1/occupancies/${id}`),
  end: (id: number) => apiClient.post<Occupancy>(`/api/v1/occupancies/${id}/end`),
};