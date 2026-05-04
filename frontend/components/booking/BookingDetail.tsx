import { BookingSummary } from '@/components/booking/BookingSummary'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/lib/date-utils'
import type { Booking } from '@/types'

export function BookingDetail({ booking }: { booking: Booking }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <Card>
          <h1 className="text-2xl font-semibold">
            {booking.trip?.title || booking.hotelRoom?.hotel.name || 'Travel booking'}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
            Travel begins on {formatDate(booking.travelDate)}
          </p>
          {booking.specialRequests ? (
            <div className="mt-4 rounded-2xl bg-[var(--color-surface-muted)] p-4 text-sm">
              <p className="font-medium">Special requests</p>
              <p className="mt-2 text-[var(--color-foreground-muted)]">
                {booking.specialRequests}
              </p>
            </div>
          ) : null}
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">What&apos;s included</h2>
          <ul className="mt-4 grid gap-2 text-sm text-[var(--color-foreground-muted)]">
            <li>Booking confirmation reference and payment status</li>
            <li>Hotel, guide, or transport details when present</li>
            <li>Cancellation state and special request history</li>
          </ul>
        </Card>
      </div>
      <BookingSummary booking={booking} />
    </div>
  )
}
