'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { BookingSummary } from '@/components/booking/BookingSummary'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/PageContainer'
import { api } from '@/lib/api'

export default function BookingReservedPage() {
  const params = useParams<{ id: string }>()
  const booking = useQuery({
    queryKey: ['bookings', params.id],
    queryFn: () => api.bookings.detail(params.id),
  })

  return (
    <PageContainer className="py-8">
      {booking.data ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div>
            <h1 className="text-[length:var(--fluid-h2)] font-semibold">Reserved booking</h1>
            <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
              Your booking is reserved. Complete payment before the hold expires.
            </p>
          </div>
          <BookingSummary booking={booking.data} />
        </div>
      ) : (
        <p>Loading booking...</p>
      )}
      {booking.data ? (
        <div className="mt-6">
          <Button asChild>
            <Link href={`/booking/payment?bookingId=${booking.data.id}`}>Continue to payment</Link>
          </Button>
        </div>
      ) : null}
    </PageContainer>
  )
}
