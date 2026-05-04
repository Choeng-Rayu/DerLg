'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card } from '@/components/ui/card'

export default function GuideDetailPage() {
  const params = useParams<{ id: string }>()
  const guide = useQuery({
    queryKey: ['guide', params.id],
    queryFn: () => api.guides.detail(params.id),
  })

  return (
    <PageContainer className="py-8">
      {guide.data ? (
        <Card>
          <h1 className="text-[length:var(--fluid-h2)] font-semibold">{guide.data.user?.name}</h1>
          <p className="mt-3 text-[var(--color-foreground-muted)]">{guide.data.bio}</p>
        </Card>
      ) : null}
    </PageContainer>
  )
}
