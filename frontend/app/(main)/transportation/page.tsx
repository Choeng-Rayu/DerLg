'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { VehicleCard } from '@/components/booking/VehicleCard'
import { PageContainer } from '@/components/layout/PageContainer'

export default function TransportationPage() {
  const vehicles = useQuery({
    queryKey: ['transportation'],
    queryFn: () => api.transportation.list({ perPage: 12 }),
  })

  return (
    <PageContainer className="py-8">
      <h1 className="text-[length:var(--fluid-h2)] font-semibold">Transportation</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {vehicles.data?.items.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </PageContainer>
  )
}
