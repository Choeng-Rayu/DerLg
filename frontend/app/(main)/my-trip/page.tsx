'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { BookingCard } from '@/components/booking/BookingCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { Tabs } from '@/components/ui/tabs'
import { api } from '@/lib/api'

export default function MyTripPage() {
  const [tab, setTab] = useState('upcoming')

  return (
    <RequireAuth>
      <MyTripContent tab={tab} setTab={setTab} />
    </RequireAuth>
  )
}

function MyTripContent({
  tab,
  setTab,
}: {
  tab: string
  setTab: (value: string) => void
}) {
  const status =
    tab === 'upcoming' ? 'CONFIRMED' : tab === 'pending' ? 'RESERVED' : 'CANCELLED'
  const bookings = useQuery({
    queryKey: ['my-trip', status],
    queryFn: () => api.bookings.list({ status, page: 1, perPage: 12 }),
  })

  return (
    <PageContainer className="py-8">
      <div className="mb-6">
        <h1 className="text-[length:var(--fluid-h2)] font-semibold">My trips</h1>
        <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
          Upcoming, pending, and past reservations in one place.
        </p>
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { label: 'Upcoming', value: 'upcoming' },
          { label: 'Pending', value: 'pending' },
          { label: 'Past / cancelled', value: 'past' },
        ]}
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bookings.data?.items.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </PageContainer>
  )
}
