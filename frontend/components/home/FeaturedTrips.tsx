'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/date-utils'

export function FeaturedTrips() {
  const trips = useQuery({
    queryKey: ['trips', 'featured'],
    queryFn: () => api.trips.featured(),
  })

  return (
    <section className="py-8">
      <PageContainer>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[length:var(--fluid-h3)] font-semibold">Featured trips</h2>
            <p className="text-sm text-[var(--color-foreground-muted)]">
              Reliable starting points for first-time visitors and repeat travelers.
            </p>
          </div>
          <Link href="/explore" className="text-sm font-medium text-[var(--color-primary-600)]">
            View all
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trips.isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-64 rounded-3xl" />
              ))
            : trips.data?.map((trip) => (
                <Link key={trip.id} href={`/trips/${trip.id}`}>
                  <Card className="h-full overflow-hidden p-0 transition hover:-translate-y-0.5">
                    <div className="h-44 bg-[linear-gradient(135deg,#0e7490,#0f172a)]" />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold">{trip.title}</h3>
                          <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">
                            {trip.destination || trip.province || 'Cambodia'}
                          </p>
                        </div>
                        {trip.avgRating ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                            <Star className="size-3.5 fill-current" />
                            {trip.avgRating.toFixed(1)}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 flex items-end justify-between">
                        <p className="text-sm text-[var(--color-foreground-muted)]">
                          {trip.durationDays} days
                        </p>
                        <p className="text-base font-semibold">
                          {formatCurrency(trip.pricePerPersonUsd)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
        </div>
      </PageContainer>
    </section>
  )
}
