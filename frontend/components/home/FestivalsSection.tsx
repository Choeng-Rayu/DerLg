'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { PageContainer } from '@/components/layout/PageContainer'
import { FestivalCard } from '@/components/explore/FestivalCard'
import { Skeleton } from '@/components/ui/Skeleton'

export function FestivalsSection() {
  const festivals = useQuery({
    queryKey: ['festivals', 'upcoming'],
    queryFn: () => api.festivals.list({ limit: 6 }),
  })

  return (
    <section className="py-8">
      <PageContainer>
        <div className="mb-4">
          <h2 className="text-[length:var(--fluid-h3)] font-semibold">Festival calendar</h2>
          <p className="text-sm text-foreground-muted">
            Useful context for peak travel, local ceremonies, and better timing.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {festivals.isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-52 rounded-3xl" />
              ))
            : festivals.data?.map((festival) => (
                <FestivalCard key={festival.id} festival={festival} />
              ))}
        </div>
      </PageContainer>
    </section>
  )
}
