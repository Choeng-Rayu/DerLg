'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { normalizeLocale } from '@/lib/i18n'
import { useAppStore } from '@/stores/app-store'
import { useAuthStore } from '@/stores/authStore'
import type { LoginCredentials, RegisterData } from '@/types'

export function useAuth() {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)
  const clearSession = useAuthStore((state) => state.clearSession)
  const setUser = useAuthStore((state) => state.setUser)
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const setLanguage = useAppStore((state) => state.setLanguage)

  const bootstrap = useQuery({
    queryKey: ['auth', 'bootstrap'],
    queryFn: async () => {
      if (accessToken && user) {
        return user
      }

      const refreshed = await api.auth.refresh()
      if (!refreshed.accessToken) {
        clearSession()
        return null
      }

      const profile = await api.users.profile()
      setSession({
        accessToken: refreshed.accessToken,
        user: profile,
      })
      setLanguage(normalizeLocale(profile.preferredLanguage))
      return profile
    },
    retry: false,
  })

  const login = useMutation({
    mutationFn: (payload: LoginCredentials) => api.auth.login(payload),
    onSuccess: (result) => {
      setSession(result)
      setLanguage(normalizeLocale(result.user.preferredLanguage))
    },
  })

  const register = useMutation({
    mutationFn: (payload: RegisterData) => api.auth.register(payload),
  })

  const refreshProfile = useMutation({
    mutationFn: () => api.users.profile(),
    onSuccess: (profile) => setUser(profile),
  })

  const logout = useMutation({
    mutationFn: () => api.auth.logout(),
    onSettled: () => {
      clearSession()
      router.push('/')
    },
  })

  return {
    user,
    isAuthenticated: Boolean(user && accessToken),
    login,
    register,
    logout,
    refreshProfile,
    bootstrap,
  }
}
