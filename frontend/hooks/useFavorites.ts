'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'

export function useFavorites() {
  const favorites = useAppStore((state) => state.favorites)
  const toggleFavorite = useAppStore((state) => state.toggleFavorite)

  return useMemo(
    () => ({
      favorites,
      isFavorite: (id: string) => favorites.includes(id),
      toggleFavorite,
    }),
    [favorites, toggleFavorite],
  )
}
