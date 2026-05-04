import Link from 'next/link'
import { BedDouble, Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/date-utils'
import type { Hotel } from '@/types'

export function HotelCard({ hotel }: { hotel: Hotel }) {
  const minPrice = hotel.rooms?.length
    ? Math.min(...hotel.rooms.map((room) => room.pricePerNightUsd))
    : undefined

  return (
    <Link href={`/hotels/${hotel.id}`}>
      <Card className="h-full transition hover:-translate-y-0.5">
        <h3 className="text-lg font-semibold">{hotel.name}</h3>
        <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">{hotel.province || 'Cambodia'}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {hotel.starRating ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
              <Star className="size-3.5 fill-current" />
              {hotel.starRating} star
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 text-[var(--color-foreground-muted)]">
            <BedDouble className="size-4" />
            {hotel.rooms?.length || 0} room types
          </span>
        </div>
        <p className="mt-4 text-sm font-medium">
          {minPrice ? `From ${formatCurrency(minPrice)} / night` : 'Request pricing'}
        </p>
      </Card>
    </Link>
  )
}
