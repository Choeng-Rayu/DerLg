'use client'

import { useMemo } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { BookingForm } from '@/components/booking/BookingForm'

export default function BookingPage() {
  const tripId = useMemo(() => {
    if (typeof window === 'undefined') return undefined
    return new URLSearchParams(window.location.search).get('tripId') || undefined
  }, [])

  return (
    <PageContainer className="py-8">
      <div className="mb-6">
        <h1 className="text-[length:var(--fluid-h2)] font-semibold">Booking flow</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Reserve the itinerary first, then move to payment while the backend hold is active.
        </p>
      </div>
      <BookingForm tripId={tripId} />
    </PageContainer>
  )
}
