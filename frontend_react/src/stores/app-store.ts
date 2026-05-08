import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isChatOpen: boolean;
  activeModal: string | null;
  language: 'en' | 'kh' | 'zh';
  theme: 'light' | 'dark';
  currency: string;
  // setters
  setUser: (user: User | null) => void;
  setAuthenticated: (auth: boolean) => void;
  setChatOpen: (open: boolean) => void;
  setActiveModal: (modal: string | null) => void;
  setLanguage: (lang: 'en' | 'kh' | 'zh') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setCurrency: (currency: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isChatOpen: false,
      activeModal: null,
      language: 'en',
      theme: 'light',
      currency: 'USD',
      setUser: (user) => set({ user }),
      setAuthenticated: (auth) => set({ isAuthenticated: auth }),
      setChatOpen: (open) => set({ isChatOpen: open }),
      setActiveModal: (modal) => set({ activeModal: modal }),
      setLanguage: (lang) => set({ language: lang }),
      setTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: 'derlg-storage',
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        currency: state.currency,
      }),
    }
  )
);
