import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../services/usersApi';
import type { UserCreate, UserUpdate } from '@/types/api';

const USERS_KEY = ['users'] as const;

export function useUsers(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: () => usersApi.list({ page, page_size: pageSize }).then((r) => r.data),
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UserCreate) => usersApi.create(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) =>
      usersApi.update(id, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  });
}
