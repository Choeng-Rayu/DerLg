'use client'

import { NextIntlClientProvider } from 'next-intl'
import { useEffect } from 'react'
import { defaultLocale, messages, normalizeLocale } from '@/lib/i18n'
import { useAppStore } from '@/stores/app-store'

export function IntlProvider({ children }: { children: React.ReactNode }) {
  const language = useAppStore((state) => state.language)
  const setLanguage = useAppStore((state) => state.setLanguage)

  useEffect(() => {
    if (!language && typeof window !== 'undefined') {
      setLanguage(normalizeLocale(window.navigator.language))
    }
  }, [language, setLanguage])

  const locale = language || defaultLocale

  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      {children}
    </NextIntlClientProvider>
  )
}
