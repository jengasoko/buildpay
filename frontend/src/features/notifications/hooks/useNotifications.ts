import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../services/notificationsApi';

const NOTIFICATIONS_KEY = ['notifications'] as const;

export function useNotifications(pageSize = 20) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, pageSize],
    queryFn: () => notificationsApi.list({ page: 1, page_size: pageSize }).then((r) => r.data),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'unread'],
    queryFn: () => notificationsApi.unreadCount().then((r) => r.data.count),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead().then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}