'use client'

import { useMemo } from 'react'
import { PaymentForm } from '@/components/booking/PaymentForm'
import { PageContainer } from '@/components/layout/PageContainer'

export default function PaymentPage() {
  const bookingId = useMemo(() => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('bookingId')
  }, [])

  return (
    <PageContainer className="py-8">
      <h1 className="text-[length:var(--fluid-h2)] font-semibold">Payment</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Stripe intent creation is live. Card confirmation can be completed as soon as the public key is configured.
      </p>
      <div className="mt-6">
        {bookingId ? <PaymentForm bookingId={bookingId} /> : <p>Missing booking ID.</p>}
      </div>
    </PageContainer>
  )
}
