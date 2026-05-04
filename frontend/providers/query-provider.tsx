'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: true,
        retry(failureCount, error: Error & { status?: number }) {
          if (error.status && error.status >= 400 && error.status < 500) {
            return false
          }
          return failureCount < 3
        },
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(createQueryClient)

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
