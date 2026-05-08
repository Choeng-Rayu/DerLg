'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PhotoGallery } from '@/components/trips/PhotoGallery'
import { ReviewsSection } from '@/components/trips/ReviewsSection'
import { TripItinerary } from '@/components/trips/TripItinerary'
import { formatCurrency } from '@/lib/date-utils'

export default function TripDetailPage() {
  const params = useParams<{ id: string }>()
  const trip = useQuery({
    queryKey: ['trip', params.id],
    queryFn: () => api.trips.detail(params.id),
  })

  if (trip.isLoading || !trip.data) {
    return <PageContainer className="py-8">Loading trip...</PageContainer>
  }

  return (
    <PageContainer className="py-8">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
              {trip.data.destination || trip.data.province || 'Cambodia'}
            </p>
            <h1 className="mt-3 text-[length:var(--fluid-h2)] font-semibold">{trip.data.title}</h1>
            <p className="mt-4 text-foreground-muted">
              {trip.data.description || 'Trip details sync directly from the backend trip catalog.'}
            </p>
          </Card>
          <PhotoGallery images={trip.data.imageUrls} />
          <TripItinerary itinerary={trip.data.itinerary} />
          <ReviewsSection rating={trip.data.avgRating} reviewCount={trip.data.reviewCount} />
        </div>
        <div className="space-y-6">
          <Card>
            <p className="text-sm text-foreground-muted">From</p>
            <p className="mt-1 text-3xl font-semibold">
              {formatCurrency(trip.data.pricePerPersonUsd)}
            </p>
            <p className="mt-2 text-sm text-foreground-muted">
              {trip.data.durationDays} days
            </p>
            <Button asChild className="mt-6 w-full">
              <Link href={`/booking?tripId=${trip.data.id}`}>Book now</Link>
            </Button>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold">Trip notes</h2>
            <ul className="mt-4 grid gap-2 text-sm text-foreground-muted">
              <li>Meeting point, inclusions, and policies can be expanded as backend fields are exposed.</li>
              <li>The booking flow already matches the backend DTO and payment hold model.</li>
              <li>Recommended and similar trips can slot into this panel next.</li>
            </ul>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
