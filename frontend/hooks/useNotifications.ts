'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useNotifications() {
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list({ page: 1, perPage: 20 }),
  })

  const markAsRead = useMutation({
    mutationFn: (id: string) => api.notifications.read(id),
  })

  const markAllAsRead = useMutation({
    mutationFn: () => api.notifications.readAll(),
  })

  return {
    notifications,
    markAsRead,
    markAllAsRead,
  }
}
