'use client'

import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/useDebounce'
import { api } from '@/lib/api'

export function useSearch(term: string) {
  const debounced = useDebounce(term, 300)

  const [trips, places, festivals, hotels] = useQueries({
    queries: [
      {
        queryKey: ['search', 'trips', debounced],
        queryFn: () => api.trips.list({ search: debounced, perPage: 5 }),
        enabled: debounced.length > 1,
      },
      {
        queryKey: ['search', 'places', debounced],
        queryFn: () => api.explore.places({ search: debounced, perPage: 5 }),
        enabled: debounced.length > 1,
      },
      {
        queryKey: ['search', 'festivals', debounced],
        queryFn: () => api.festivals.list({ search: debounced, limit: 5 }),
        enabled: debounced.length > 1,
      },
      {
        queryKey: ['search', 'hotels', debounced],
        queryFn: () => api.hotels.list({ search: debounced, perPage: 5 }),
        enabled: debounced.length > 1,
      },
    ],
  })

  const groups = useMemo(
    () => [
      { label: 'Trips', type: 'trip', items: trips.data?.items || [] },
      { label: 'Places', type: 'place', items: places.data?.items || [] },
      { label: 'Festivals', type: 'festival', items: festivals.data || [] },
      { label: 'Hotels', type: 'hotel', items: hotels.data?.items || [] },
    ],
    [festivals.data, hotels.data?.items, places.data?.items, trips.data?.items],
  )

  return {
    term: debounced,
    groups,
    isLoading: [trips, places, festivals, hotels].some((query) => query.isLoading),
  }
}
