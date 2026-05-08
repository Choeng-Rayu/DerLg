'use client'

import { QueryProvider } from '@/providers/query-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { IntlProvider } from '@/providers/intl-provider'
import { AuthBootstrap } from '@/components/auth/AuthBootstrap'
import { Toaster } from '@/components/ui/Toast'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <IntlProvider>
        <QueryProvider>
          <AuthBootstrap />
          {children}
          <Toaster />
        </QueryProvider>
      </IntlProvider>
    </ThemeProvider>
  )
}
