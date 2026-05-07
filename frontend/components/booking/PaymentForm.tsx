'use client'

import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/date-utils'

export function PaymentForm({ bookingId }: { bookingId: string }) {
  const [method, setMethod] = useState<'card' | 'qr'>('card')
  const intent = useMutation({
    mutationFn: () => api.payments.createIntent(bookingId),
  })

  const paymentUrl = useMemo(() => {
    if (!intent.data) return ''
    return `${window.location.origin}/booking/confirmation?paymentIntentId=${intent.data.paymentIntentId}`
  }, [intent.data])

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Payment</h2>
        <div className="inline-flex rounded-full bg-surface-muted p-1">
          {[
            { label: 'Card', value: 'card' },
            { label: 'QR', value: 'qr' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setMethod(item.value as 'card' | 'qr')}
              className={`rounded-full px-4 py-2 text-sm ${
                method === item.value
                  ? 'bg-surface-raised shadow-sm'
                  : 'text-foreground-muted'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm text-foreground-muted">
        Stripe payment intent creation is wired to the backend. Card capture can be completed once the publishable key and live checkout confirmation flow are configured.
      </p>
      <div className="mt-5">
        <Button type="button" loading={intent.isPending} onClick={() => intent.mutate()}>
          Create payment intent
        </Button>
      </div>
      {intent.data ? (
        <div className="mt-6 rounded-2xl bg-surface-muted p-4">
          <p className="font-medium">
            Amount due: {formatCurrency(intent.data.amountUsd)}
          </p>
          <p className="mt-1 text-sm text-foreground-muted">
            Payment intent: {intent.data.paymentIntentId}
          </p>
          {method === 'qr' ? (
            <div className="mt-4 inline-flex rounded-2xl bg-white p-3">
              <QRCodeSVG value={paymentUrl || intent.data.clientSecret} size={168} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-foreground-muted">
              Client secret ready. Complete the Stripe Elements step after env keys are set.
            </p>
          )}
        </div>
      ) : null}
    </Card>
  )
}
