import apiClient from '@/services/api';
import type { PaginatedResponse, Payment, PaymentCreate, PaymentUpdate, QueryParams } from '@/types/api';

export const paymentsApi = {
  list: (params?: QueryParams) =>
    apiClient.get<PaginatedResponse<Payment>>('/api/v1/payments/', { params }),
  get: (id: number) => apiClient.get<Payment>(`/api/v1/payments/${id}`),
  create: (data: PaymentCreate) => apiClient.post<Payment>('/api/v1/payments/', data),
  update: (id: number, data: PaymentUpdate) =>
    apiClient.put<Payment>(`/api/v1/payments/${id}`, data),
};
