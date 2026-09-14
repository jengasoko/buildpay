import apiClient from '@/services/api';
import type { LoginRequest, LoginResponse, User, UserCreate } from '@/types/api';

export const authApi = {
  login: (data: LoginRequest) => apiClient.post<LoginResponse>('/api/v1/auth/login', data),
  register: (data: UserCreate) => apiClient.post('/api/v1/auth/register', data),
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/v1/users/me');
    return response.data;
  },
  logoutUser: (): void => {
    localStorage.removeItem('access_token');
  },
};
