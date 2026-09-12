import { useCallback, useMemo, useState } from 'react';
import type { User } from '@/types/api';
import apiClient from '@/services/api';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

const INITIAL_STATE: AuthState = {
  token: localStorage.getItem('access_token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
};

export function useAuthStore() {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);

  const setAuth = useCallback((token: string, user: User) => {
    localStorage.setItem('access_token', token);
    setState({ token, user, isAuthenticated: true });
  }, []);

  const setUser = useCallback((user: User) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    setState({ token: null, user: null, isAuthenticated: false });
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await apiClient.get<User>('/api/v1/users/me');
      setUser(response.data);
      return response.data;
    } catch {
      logout();
      return null;
    }
  }, [setUser, logout]);

  return useMemo(
    () => ({
      ...state,
      setAuth,
      setUser,
      logout,
      fetchUser,
    }),
    [state, setAuth, setUser, logout, fetchUser],
  );
}
