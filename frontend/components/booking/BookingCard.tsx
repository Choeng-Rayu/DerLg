import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/date-utils'
import type { Booking } from '@/types'

export function BookingCard({ booking }: { booking: Booking }) {
  return (
    <Link href={`/my-trip/${booking.bookingRef}`}>
      <Card className="transition hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">
              {booking.trip?.title || booking.hotelRoom?.hotel.name || 'Travel booking'}
            </h3>
            <p className="mt-1 text-sm text-foreground-muted">
              {formatDate(booking.travelDate)}
            </p>
          </div>
          <Badge tone={booking.status === 'CONFIRMED' ? 'success' : booking.status === 'CANCELLED' ? 'danger' : 'warning'}>
            {booking.status}
          </Badge>
        </div>
        <div className="mt-4 flex justify-between gap-3 text-sm">
          <span className="text-foreground-muted">{booking.bookingRef}</span>
          <span className="font-medium">{formatCurrency(booking.totalUsd)}</span>
        </div>
      </Card>
    </Link>
  )
}
