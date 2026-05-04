'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { FestivalCard } from '@/components/explore/FestivalCard'
import { PageContainer } from '@/components/layout/PageContainer'

export default function FestivalsPage() {
  const festivals = useQuery({
    queryKey: ['festivals', 'page'],
    queryFn: () => api.festivals.list({ limit: 18 }),
  })

  return (
    <PageContainer className="py-8">
      <h1 className="text-[length:var(--fluid-h2)] font-semibold">Festivals</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {festivals.data?.map((festival) => (
          <FestivalCard key={festival.id} festival={festival} />
        ))}
      </div>
    </PageContainer>
  )
}
