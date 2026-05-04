import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Place } from '@/types'

export function PlaceCard({ place }: { place: Place }) {
  return (
    <Link href={`/explore?place=${place.id}`}>
      <Card className="h-full transition hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{place.name}</h3>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-[var(--color-foreground-muted)]">
              <MapPin className="size-4" />
              {place.province || 'Cambodia'}
            </p>
          </div>
          {place.category ? <Badge>{place.category}</Badge> : null}
        </div>
        <p className="mt-4 line-clamp-3 text-sm text-[var(--color-foreground-muted)]">
          {place.description || 'A destination worth adding to your itinerary.'}
        </p>
      </Card>
    </Link>
  )
}
