'use client'

import { useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { PageContainer } from '@/components/layout/PageContainer'
import { ConfirmationActions } from '@/components/booking/ConfirmationActions'
import { Card } from '@/components/ui/Card'

export default function BookingConfirmationPage() {
  const reference = useMemo(() => {
    if (typeof window === 'undefined') return 'Pending confirmation'
    return (
      new URLSearchParams(window.location.search).get('bookingRef') ||
      'Pending confirmation'
    )
  }, [])

  return (
    <PageContainer className="py-8">
      <Card className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">
          Booking confirmation
        </p>
        <h1 className="mt-3 text-[length:var(--fluid-h2)] font-semibold">You&apos;re all set</h1>
        <p className="mt-3 text-foreground-muted">
          Reference: {reference}
        </p>
        <div className="mt-6 inline-flex rounded-3xl bg-white p-4 shadow-sm">
          <QRCodeSVG value={reference} size={180} />
        </div>
        <p className="mx-auto mt-6 max-w-xl text-sm text-foreground-muted">
          Email delivery, receipt PDF generation, and calendar export are wired in the UI and ready to connect to the final backend endpoints.
        </p>
        <div className="mt-8 flex justify-center">
          <ConfirmationActions />
        </div>
      </Card>
    </PageContainer>
  )
}
