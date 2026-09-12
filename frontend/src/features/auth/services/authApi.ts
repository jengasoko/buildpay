import apiClient from '@/services/api';
import type { LoginRequest, LoginResponse } from '@/types/api';

export const authApi = {
  login: (data: LoginRequest) => apiClient.post<LoginResponse>('/api/v1/auth/login', data),
  register: (data: { username: string; email: string; password: string; role?: string }) =>
    apiClient.post('/api/v1/auth/register', data),
};
