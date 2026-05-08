'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { PageContainer } from '@/components/layout/PageContainer'
import { Tabs } from '@/components/ui/Tabs'
import { Input } from '@/components/ui/Input'
import { PlaceCard } from '@/components/explore/PlaceCard'
import { FestivalCard } from '@/components/explore/FestivalCard'
import { MapView } from '@/components/maps/MapView'
import { Skeleton } from '@/components/ui/Skeleton'

export default function ExplorePage() {
  const [tab, setTab] = useState('places')
  const [search, setSearch] = useState('')
  const [category] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined
    return new URLSearchParams(window.location.search).get('category') || undefined
  })

  const places = useQuery({
    queryKey: ['explore', 'places', category, search],
    queryFn: () => api.explore.places({ category, search, perPage: 12 }),
  })
  const festivals = useQuery({
    queryKey: ['explore', 'festivals', search],
    queryFn: () => api.festivals.list({ search, limit: 12 }),
  })

  const markers = useMemo(
    () =>
      places.data?.items.map((place) => ({
        id: place.id,
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
      })) || [],
    [places.data?.items],
  )

  return (
    <PageContainer className="py-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[length:var(--fluid-h2)] font-semibold">Explore Cambodia</h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Filter places, festivals, and map context without leaving the planning flow.
          </p>
        </div>
        <div className="w-full max-w-md">
          <Input
            placeholder="Search places or festivals"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { label: 'Places', value: 'places' },
          { label: 'Festivals', value: 'festivals' },
          { label: 'Map', value: 'map' },
        ]}
      />
      <div className="mt-6">
        {tab === 'places' ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {places.isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-52 rounded-3xl" />
                ))
              : places.data?.items.map((place) => <PlaceCard key={place.id} place={place} />)}
          </div>
        ) : null}
        {tab === 'festivals' ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {festivals.isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-52 rounded-3xl" />
                ))
              : festivals.data?.map((festival) => (
                  <FestivalCard key={festival.id} festival={festival} />
                ))}
          </div>
        ) : null}
        {tab === 'map' ? <MapView markers={markers} /> : null}
      </div>
    </PageContainer>
  )
}
