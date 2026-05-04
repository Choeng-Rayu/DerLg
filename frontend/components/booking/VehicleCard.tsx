import Link from 'next/link'
import { UsersRound } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/date-utils'
import type { Vehicle } from '@/types'

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link href={`/transportation?vehicle=${vehicle.id}`}>
      <Card className="h-full transition hover:-translate-y-0.5">
        <h3 className="text-lg font-semibold">{vehicle.model || vehicle.category}</h3>
        <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
          {vehicle.category} · {vehicle.tier || 'Standard'}
        </p>
        <div className="mt-4 flex justify-between gap-3 text-sm">
          <span className="inline-flex items-center gap-1 text-[var(--color-foreground-muted)]">
            <UsersRound className="size-4" />
            {vehicle.seatCapacity || 'Flexible'} seats
          </span>
          <span className="font-medium">
            {vehicle.pricePerDayUsd ? formatCurrency(vehicle.pricePerDayUsd) : 'Quote'}
          </span>
        </div>
      </Card>
    </Link>
  )
}
