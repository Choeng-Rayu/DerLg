'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAppStore } from '@/stores/app-store'

export function useCurrency() {
  const currency = useAppStore((state) => state.currency)
  const setCurrency = useAppStore((state) => state.setCurrency)

  const rates = useQuery({
    queryKey: ['currency', 'rates'],
    queryFn: () => api.currency.rates(),
    staleTime: 24 * 60 * 60 * 1000,
  })

  return {
    currency,
    setCurrency,
    rates,
  }
}
