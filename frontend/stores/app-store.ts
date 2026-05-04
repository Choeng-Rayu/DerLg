'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage, CurrencyCode, Locale, ThemeMode } from '@/types'

interface AppState {
  language: Locale
  theme: ThemeMode
  currency: CurrencyCode
  isChatOpen: boolean
  isDrawerOpen: boolean
  activeModal: string | null
  favorites: string[]
  chatHistory: ChatMessage[]
  setLanguage: (language: Locale) => void
  setTheme: (theme: ThemeMode) => void
  setCurrency: (currency: CurrencyCode) => void
  openChat: () => void
  closeChat: () => void
  setDrawerOpen: (open: boolean) => void
  setActiveModal: (modal: string | null) => void
  toggleFavorite: (id: string) => void
  addMessage: (message: ChatMessage) => void
  clearChat: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'en',
      theme: 'system',
      currency: 'USD',
      isChatOpen: false,
      isDrawerOpen: false,
      activeModal: null,
      favorites: [],
      chatHistory: [],
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),
      openChat: () => set({ isChatOpen: true }),
      closeChat: () => set({ isChatOpen: false }),
      setDrawerOpen: (open) => set({ isDrawerOpen: open }),
      setActiveModal: (modal) => set({ activeModal: modal }),
      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((item) => item !== id)
            : [...state.favorites, id],
        })),
      addMessage: (message) =>
        set((state) => ({
          chatHistory: [...state.chatHistory.slice(-49), message],
        })),
      clearChat: () => set({ chatHistory: [] }),
    }),
    {
      name: 'derlg-app',
      version: 1,
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        currency: state.currency,
        favorites: state.favorites.slice(-50),
        chatHistory: state.chatHistory.slice(-50),
      }),
    },
  ),
)
