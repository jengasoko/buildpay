import apiClient from '@/services/api';
import type {
  Application,
  ApplicationCreate,
  ApplicationStatus,
  ApplicationUpdate,
  PaginatedResponse,
  QueryParams,
} from '@/types/api';

export interface ListApplicationParams extends QueryParams {
  status?: ApplicationStatus;
}

export const applicationsApi = {
  list: (params?: ListApplicationParams) =>
    apiClient.get<PaginatedResponse<Application>>('/api/v1/applications', { params }),
  create: (data: ApplicationCreate) =>
    apiClient.post<Application>('/api/v1/applications', data),
  update: (id: number, data: ApplicationUpdate) =>
    apiClient.put<Application>(`/api/v1/applications/${id}`, data),
};