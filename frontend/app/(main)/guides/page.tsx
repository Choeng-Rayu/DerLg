'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { GuideCard } from '@/components/booking/GuideCard'
import { PageContainer } from '@/components/layout/PageContainer'

export default function GuidesPage() {
  const guides = useQuery({
    queryKey: ['guides'],
    queryFn: () => api.guides.list({ perPage: 12 }),
  })

  return (
    <PageContainer className="py-8">
      <h1 className="text-[length:var(--fluid-h2)] font-semibold">Guides</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {guides.data?.items.map((guide) => (
          <GuideCard key={guide.id} guide={guide} />
        ))}
      </div>
    </PageContainer>
  )
}
