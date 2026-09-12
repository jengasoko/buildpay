import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../services/usersApi';

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
