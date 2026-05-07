'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setSession } = useAuthStore()

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    
    if (accessToken) {
      // If we only have the token, we fetch the profile to complete the session
      api.users.profile().then((user) => {
        setSession({ accessToken, user })
        router.push('/')
      }).catch(() => {
        router.push('/login?error=oauth_failed')
      })
    } else {
      router.push('/login')
    }
  }, [searchParams, router, setSession])

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="size-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      <p className="mt-4 text-sm text-foreground-muted">Completing sign in...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackContent />
    </Suspense>
  )
}
