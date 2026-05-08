'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/Spinner'

export function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode
  role?: 'ADMIN' | 'SUPPORT'
}) {
  const router = useRouter()
  const { user, bootstrap } = useAuth()

  useEffect(() => {
    if (bootstrap.isFetched && !user) {
      router.replace(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`)
    }
  }, [bootstrap.isFetched, router, user])

  useEffect(() => {
    if (user && role && user.role !== role && user.role !== 'ADMIN') {
      router.replace('/')
    }
  }, [role, router, user])

  if (bootstrap.isLoading || !bootstrap.isFetched || !user) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner />
      </div>
    )
  }

  return <>{children}</>
}
