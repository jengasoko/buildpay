import apiClient from '@/services/api';
import type { LoginRequest, LoginResponse, User } from '@/types/api';

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', data);
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>('/api/v1/users/me');
  return response.data;
}

export function logoutUser(): void {
  localStorage.removeItem('access_token');
}
