import en from '@/messages/en.json'
import kh from '@/messages/kh.json'
import zh from '@/messages/zh.json'

export const locales = ['en', 'kh', 'zh'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  kh: 'Khmer',
  zh: '中文',
}

export const messages = {
  en,
  kh,
  zh,
} as const

export function normalizeLocale(input?: string | null): Locale {
  if (!input) return defaultLocale
  const lower = input.toLowerCase()
  if (lower.startsWith('kh') || lower.startsWith('km')) return 'kh'
  if (lower.startsWith('zh')) return 'zh'
  return 'en'
}

export function toBackendLocale(locale: Locale) {
  return locale.toUpperCase()
}
