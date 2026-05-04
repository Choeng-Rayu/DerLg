'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useEmergencyAlert() {
  const contacts = useQuery({
    queryKey: ['emergency', 'contacts'],
    queryFn: () => api.emergency.contacts(),
  })

  const createAlert = useMutation({
    mutationFn: async (payload: {
      alertType: string
      latitude: number
      longitude: number
      locationAccuracyM?: number
      message?: string
    }) => api.emergency.createAlert(payload),
  })

  return {
    contacts,
    createAlert,
  }
}
