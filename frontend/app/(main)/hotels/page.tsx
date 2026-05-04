'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { HotelCard } from '@/components/booking/HotelCard'
import { PageContainer } from '@/components/layout/PageContainer'

export default function HotelsPage() {
  const hotels = useQuery({
    queryKey: ['hotels'],
    queryFn: () => api.hotels.list({ perPage: 12 }),
  })

  return (
    <PageContainer className="py-8">
      <h1 className="text-[length:var(--fluid-h2)] font-semibold">Hotels</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {hotels.data?.items.map((hotel) => (
          <HotelCard key={hotel.id} hotel={hotel} />
        ))}
      </div>
    </PageContainer>
  )
}
