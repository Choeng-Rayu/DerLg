import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAppStore } from '@/stores/app-store';
import type { BaseApiResponse } from '@/types';
import type { LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';
import type { User } from '@/types/base';

export function useLogin() {
  const setUser = useAppStore((s) => s.setUser);
  const setAuthenticated = useAppStore((s) => s.setAuthenticated);

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await api.post<BaseApiResponse<AuthResponse>>('/auth/login', credentials);
      return res.data;
    },
    onSuccess: (data) => {
      setUser(data.data.user as User);
      setAuthenticated(true);
    },
  });
}

export function useRegister() {
  const setUser = useAppStore((s) => s.setUser);
  const setAuthenticated = useAppStore((s) => s.setAuthenticated);

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await api.post<BaseApiResponse<AuthResponse>>('/auth/register', data);
      return res.data;
    },
    onSuccess: (data) => {
      setUser(data.data.user as User);
      setAuthenticated(true);
    },
  });
}

export function useLogout() {
  const setUser = useAppStore((s) => s.setUser);
  const setAuthenticated = useAppStore((s) => s.setAuthenticated);

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      setUser(null);
      setAuthenticated(false);
    },
  });
}

export function useCurrentUser() {
  const setUser = useAppStore((s) => s.setUser);
  const setAuthenticated = useAppStore((s) => s.setAuthenticated);

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await api.get<BaseApiResponse<{ user: User }>>('/auth/me');
      return res.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data.data.user);
      setAuthenticated(true);
    }
  }, [query.data, setUser, setAuthenticated]);

  useEffect(() => {
    if (query.error) {
      setUser(null);
      setAuthenticated(false);
    }
  }, [query.error, setUser, setAuthenticated]);

  return query;
}
