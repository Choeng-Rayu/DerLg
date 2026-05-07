'use client'

import { useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'

export function TelegramLoginButton() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { setSession } = useAuthStore()

  useEffect(() => {
    // We handle the callback in a global function that the Telegram widget will call
    ;(window as any).onTelegramAuth = async (user: any) => {
      try {
        const result = await api.auth.telegram(user)
        setSession(result)
        router.push('/')
      } catch (error) {
        console.error('Telegram auth failed', error)
      }
    }

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', 'DerLgBot') // Replace with actual bot username
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-radius', '16')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')

    if (containerRef.current) {
      containerRef.current.appendChild(script)
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [router, setSession])

  return (
    <div className="flex w-full justify-center" ref={containerRef} />
  )
}
