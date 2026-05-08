'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/date-utils'

export default function HotelDetailPage() {
  const params = useParams<{ id: string }>()
  const hotel = useQuery({
    queryKey: ['hotel', params.id],
    queryFn: () => api.hotels.detail(params.id),
  })

  return (
    <PageContainer className="py-8">
      {hotel.data ? (
        <Card>
          <h1 className="text-[length:var(--fluid-h2)] font-semibold">{hotel.data.name}</h1>
          <p className="mt-2 text-sm text-foreground-muted">{hotel.data.province}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {hotel.data.rooms?.map((room) => (
              <div key={room.id} className="rounded-2xl bg-surface-muted p-4">
                <h2 className="font-medium">{room.roomType}</h2>
                <p className="mt-2 text-sm text-foreground-muted">
                  Capacity {room.capacity}
                </p>
                <p className="mt-2 text-sm font-medium">
                  {formatCurrency(room.pricePerNightUsd)} / night
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </PageContainer>
  )
}
