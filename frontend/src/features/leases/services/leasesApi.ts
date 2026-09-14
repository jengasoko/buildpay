import apiClient from '@/services/api';
import type {
  Invoice,
  Lease,
  LeaseStatus,
  PaginatedResponse,
  QueryParams,
  StatementOfAccount,
} from '@/types/api';

export interface ListLeaseParams extends QueryParams {
  status?: LeaseStatus;
}

export const leasesApi = {
  list: (params?: ListLeaseParams) =>
    apiClient.get<PaginatedResponse<Lease>>('/api/v1/leases', { params }),
  getMy: () => apiClient.get<Lease | null>('/api/v1/leases/me'),
  get: (id: number) => apiClient.get<Lease>(`/api/v1/leases/${id}`),
  sign: (id: number) => apiClient.post<Lease>(`/api/v1/leases/${id}/sign`),
  terminate: (id: number) => apiClient.post<Lease>(`/api/v1/leases/${id}/terminate`),
  generateInvoice: (id: number) =>
    apiClient.post<Invoice>(`/api/v1/leases/${id}/generate-invoice`),
  statement: (id: number) =>
    apiClient.get<StatementOfAccount>(`/api/v1/leases/${id}/statement`),
};