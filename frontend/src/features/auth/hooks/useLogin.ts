import { useMutation } from '@tanstack/react-query';
import { authApi } from '../services/authApi';
import type { LoginRequest } from '@/types/api';

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data).then((r) => r.data),
  });
}
