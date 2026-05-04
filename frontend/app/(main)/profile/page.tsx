'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { PageContainer } from '@/components/layout/PageContainer'
import { Preferences } from '@/components/profile/Preferences'
import { LoyaltyPoints } from '@/components/profile/LoyaltyPoints'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { StudentVerification } from '@/components/profile/StudentVerification'
import { Tabs } from '@/components/ui/tabs'
import { api } from '@/lib/api'

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  )
}

function ProfileContent() {
  const [tab, setTab] = useState('info')
  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.users.profile(),
  })

  if (!profile.data) {
    return <PageContainer className="py-8">Loading profile…</PageContainer>
  }

  return (
    <PageContainer className="py-8">
      <div className="mb-6">
        <h1 className="text-[length:var(--fluid-h2)] font-semibold">Profile</h1>
        <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">
          Personal info, loyalty balance, student status, and preferences.
        </p>
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { label: 'Info', value: 'info' },
          { label: 'Points', value: 'points' },
          { label: 'Student', value: 'student' },
          { label: 'Settings', value: 'settings' },
        ]}
      />
      <div className="mt-6">
        {tab === 'info' ? <ProfileForm user={profile.data} /> : null}
        {tab === 'points' ? <LoyaltyPoints /> : null}
        {tab === 'student' ? <StudentVerification /> : null}
        {tab === 'settings' ? <Preferences /> : null}
      </div>
    </PageContainer>
  )
}
