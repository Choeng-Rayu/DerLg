import Link from 'next/link'
import { CalendarDays, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/lib/date-utils'
import type { Festival } from '@/types'

export function FestivalCard({ festival }: { festival: Festival }) {
  return (
    <Link href={`/festivals?festival=${festival.id}`}>
      <Card className="h-full transition hover:-translate-y-0.5">
        <h3 className="text-lg font-semibold">{festival.name}</h3>
        <p className="mt-2 inline-flex items-center gap-1 text-sm text-[var(--color-foreground-muted)]">
          <CalendarDays className="size-4" />
          {formatDate(festival.startDate)}
        </p>
        <p className="mt-1 inline-flex items-center gap-1 text-sm text-[var(--color-foreground-muted)]">
          <MapPin className="size-4" />
          {festival.place?.name || festival.place?.province || 'Cambodia'}
        </p>
        <p className="mt-4 line-clamp-3 text-sm text-[var(--color-foreground-muted)]">
          {festival.description || 'Seasonal celebrations, local rituals, and memorable food.'}
        </p>
      </Card>
    </Link>
  )
}
