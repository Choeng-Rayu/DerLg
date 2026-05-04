'use client'

import { create } from 'zustand'
import type { AuthSession, User } from '@/types'

interface AuthState {
  accessToken: string | null
  user: User | null
  hydrated: boolean
  setSession: (session: AuthSession) => void
  setUser: (user: User | null) => void
  clearSession: () => void
  setHydrated: (hydrated: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  hydrated: false,
  setSession: (session) =>
    set({
      accessToken: session.accessToken,
      user: session.user,
      hydrated: true,
    }),
  setUser: (user) => set({ user }),
  clearSession: () => set({ accessToken: null, user: null, hydrated: true }),
  setHydrated: (hydrated) => set({ hydrated }),
}))
