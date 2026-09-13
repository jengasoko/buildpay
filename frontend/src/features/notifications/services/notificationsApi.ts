import apiClient from '@/services/api';
import type { Notification, PaginatedResponse, QueryParams } from '@/types/api';

export const notificationsApi = {
  list: (params?: QueryParams) =>
    apiClient.get<PaginatedResponse<Notification>>('/api/v1/notifications/', { params }),
  unreadCount: () =>
    apiClient.get<{ count: number }>('/api/v1/notifications/unread-count'),
  markRead: (id: number) => apiClient.post<Notification>(`/api/v1/notifications/${id}/read`),
  markAllRead: () => apiClient.post<{ updated: number }>('/api/v1/notifications/read-all'),
};