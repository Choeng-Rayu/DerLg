'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { BookingDetail } from '@/components/booking/BookingDetail'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

export default function MyTripDetailPage() {
  return (
    <RequireAuth>
      <MyTripDetailContent />
    </RequireAuth>
  )
}

function MyTripDetailContent() {
  const params = useParams<{ bookingId: string }>()
  const booking = useQuery({
    queryKey: ['booking', params.bookingId],
    queryFn: () => api.bookings.detail(params.bookingId),
  })
  const cancelBooking = useMutation({
    mutationFn: () => api.bookings.cancel(params.bookingId, 'Cancelled from customer dashboard'),
  })

  return (
    <PageContainer className="py-8">
      {booking.data ? <BookingDetail booking={booking.data} /> : <p>Loading booking…</p>}
      <div className="mt-6">
        <Button
          type="button"
          variant="outline"
          loading={cancelBooking.isPending}
          onClick={() => cancelBooking.mutate()}
        >
          Cancel booking
        </Button>
      </div>
    </PageContainer>
  )
}
