import apiClient from '@/services/api';
import type {
  MaintenanceCreate,
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenanceUpdate,
  PaginatedResponse,
  QueryParams,
} from '@/types/api';

export interface ListMaintenanceParams extends QueryParams {
  status?: MaintenanceStatus;
}

export const maintenanceApi = {
  list: (params?: ListMaintenanceParams) =>
    apiClient.get<PaginatedResponse<MaintenanceRequest>>('/api/v1/maintenance-requests', { params }),
  get: (id: number) => apiClient.get<MaintenanceRequest>(`/api/v1/maintenance-requests/${id}`),
  create: (data: MaintenanceCreate) =>
    apiClient.post<MaintenanceRequest>('/api/v1/maintenance-requests', data),
  update: (id: number, data: MaintenanceUpdate) =>
    apiClient.put<MaintenanceRequest>(`/api/v1/maintenance-requests/${id}`, data),
};