import { Card } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/date-utils'
import type { Booking } from '@/types'

export function BookingSummary({ booking }: { booking: Booking }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold">Booking summary</h2>
      <dl className="mt-4 grid gap-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-foreground-muted">Reference</dt>
          <dd className="font-medium">{booking.bookingRef}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-foreground-muted">Travel date</dt>
          <dd className="font-medium">{formatDate(booking.travelDate)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-foreground-muted">Total</dt>
          <dd className="font-medium">{formatCurrency(booking.totalUsd)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-foreground-muted">Status</dt>
          <dd className="font-medium">{booking.status}</dd>
        </div>
      </dl>
      {booking.priceBreakdown?.discounts?.length ? (
        <div className="mt-4 rounded-2xl bg-surface-muted p-4 text-sm">
          <p className="font-medium">Discounts applied</p>
          <ul className="mt-2 grid gap-2">
            {booking.priceBreakdown.discounts.map((discount) => (
              <li key={`${discount.label}-${discount.amount}`} className="flex justify-between gap-3">
                <span>{discount.label}</span>
                <span>-{formatCurrency(discount.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  )
}
