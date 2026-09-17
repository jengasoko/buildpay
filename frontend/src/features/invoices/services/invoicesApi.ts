import apiClient from '@/services/api';
import type {
  ArrearsSummary,
  Invoice,
  InvoiceAllocateRequest,
  InvoiceStatus,
  PaginatedResponse,
  QueryParams,
} from '@/types/api';

export interface ListInvoiceParams extends QueryParams {
  lease_id?: number;
  status?: InvoiceStatus;
}

export const invoicesApi = {
  list: (params?: ListInvoiceParams) =>
    apiClient.get<PaginatedResponse<Invoice>>('/api/v1/invoices', { params }),
  get: (id: number) => apiClient.get<Invoice>(`/api/v1/invoices/${id}`),
  allocate: (id: number, data: InvoiceAllocateRequest) =>
    apiClient.post<Invoice>(`/api/v1/invoices/${id}/allocate`, data),
  arrears: () => apiClient.get<ArrearsSummary>('/api/v1/arrears'),
};